// Check file type by magic bytes
let f_s_filetype_from_s_path_abs = async function (filePath) {
  const file = await Deno.open(filePath, { read: true });
  const buffer = new Uint8Array(12);
  await file.read(buffer);
  file.close();
  
  // Images
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return 'image'; // JPEG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return 'image'; // PNG
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return 'image'; // GIF
  if (buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) return 'image'; // WebP
  
  // Videos
  if (buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) return 'video'; // MP4/MOV
  if (buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3) return 'video'; // WebM/MKV
  if (buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x00 && (buffer[3] === 0x18 || buffer[3] === 0x20)) return 'video'; // MP4
  
  return 'unknown';
}

// Get image info using ImageMagick
let f_o_info__image = async function(filePath) {
  const command = new Deno.Command("identify", {
    args: ["-format", "%w,%h,%b", filePath],
    stdout: "piped"
  });
  // console.log(`running command: identify -format "%w,%h,%b" ${filePath}`);
  const output = await command.output();
  const result = new TextDecoder().decode(output.stdout).trim();
  const [width, height, size] = result.split(',');
  
  return {
    width: parseInt(width),
    height: parseInt(height),
    size: size
  };
}

// Get video info using FFprobe
let f_o_info__video = async function(filePath) {
  const command = new Deno.Command("ffprobe", {
    args: [
      "-v", "quiet",
      "-print_format", "json",
      "-show_format",
      "-show_streams",
      filePath
    ],
    stdout: "piped"
  });
  
  const output = await command.output();
  const data = JSON.parse(new TextDecoder().decode(output.stdout));
  
  const videoStream = data.streams.find(s => s.codec_type === 'video');
  
  return {
    duration: parseFloat(data.format.duration),
    width: videoStream?.width,
    height: videoStream?.height,
    codec: videoStream?.codec_name,
    fps: videoStream?.r_frame_rate,
    bitrate: parseInt(data.format.bit_rate),
    size: parseInt(data.format.size),
    format: data.format.format_name
  };
}

import {
  f_v_crud__indb,
} from "./database_functions.module.js";
import {
  o_model__o_pose,
  o_model__o_posekeypoint,
  f_o_model_instance,
} from "./webserved_dir/constructors.module.js";
import {
  s_root_dir,
  s_ds,
} from "./runtimedata.module.js";

// downloads vitpose models if not already present
let f_download_vitpose_model = async function(){
  let s_path_model_dir = s_root_dir + s_ds + '.gitignored' + s_ds + 'models';
  let s_path_person_detector = s_path_model_dir + s_ds + 'person_detector';
  let s_path_pose_estimator = s_path_model_dir + s_ds + 'pose_estimator';

  // check if models already exist
  try {
    let o_stat_pd = await Deno.stat(s_path_person_detector);
    let o_stat_pe = await Deno.stat(s_path_pose_estimator);
    if(o_stat_pd.isDirectory && o_stat_pe.isDirectory){
      console.log('Vitpose models already downloaded');
      return;
    }
  } catch(_) {
    // directory does not exist, proceed with download
  }

  console.log('Downloading vitpose models...');
  let s_path_script = s_root_dir + s_ds + 'imageanalysis' + s_ds + 'vitpose_batch_processing.py';
  let o_command = new Deno.Command("python3", {
    args: [s_path_script, '--download-models', '--model-dir', s_path_model_dir],
    stdout: "piped",
    stderr: "piped",
  });
  let o_output = await o_command.output();
  let s_stderr = new TextDecoder().decode(o_output.stderr);
  console.log('Model download stderr:', s_stderr);
  if(!o_output.success){
    console.error('Failed to download vitpose models: ' + s_stderr);
  } else {
    console.log('Vitpose models downloaded successfully');
  }
}

// batch processing because the python script loads AI models once per call
// a_o_image: array of o_image objects, each must have n_id and s_path_absolute (from joined fsnode)
let f_a_o_pose_from_a_o_img = async function(a_o_image, f_on_progress = null){
  let a_o_pose__result = [];
  let a_o_image__to_process = [];
  let n_len = a_o_image.length;

  // check which images already have pose data in db
  for(let n_idx = 0; n_idx < n_len; n_idx++){
    let o_image = a_o_image[n_idx];
    if(f_on_progress) f_on_progress('checking cache: ' + (n_idx + 1) + '/' + n_len);
    let a_o_pose__fromdb = f_v_crud__indb(
      'read',
      o_model__o_pose,
      { n_o_image_n_id: o_image.n_id }
    );
    if(a_o_pose__fromdb && a_o_pose__fromdb.length > 0){
      // already processed, collect existing poses
      for(let o_pose of a_o_pose__fromdb){
        let a_o_posekeypoint = f_v_crud__indb(
          'read',
          o_model__o_posekeypoint,
          { n_o_pose_n_id: o_pose.n_id }
        );
        o_pose.a_o_posekeypoint = a_o_posekeypoint || [];
        a_o_pose__result.push(o_pose);
      }
    } else {
      a_o_image__to_process.push(o_image);
    }
  }

  if(a_o_image__to_process.length === 0){
    return a_o_pose__result;
  }

  // build paths for python script
  let a_s_path = a_o_image__to_process.map(function(o_image){ return o_image.s_path_absolute; });
  let s_path_model_dir = s_root_dir + s_ds + '.gitignored' + s_ds + 'models';
  let s_path_script = s_root_dir + s_ds + 'imageanalysis' + s_ds + 'vitpose_batch_processing.py';

  console.log(`Running pose estimation on ${a_s_path.length} images...`);
  if(f_on_progress) f_on_progress('loading AI models...');

  let o_command = new Deno.Command("python3", {
    args: [s_path_script, '--model-dir', s_path_model_dir, ...a_s_path],
    stdout: "piped",
    stderr: "piped",
  });

  // stream stderr to get real-time progress from python script
  // must read both stdout and stderr concurrently to avoid pipe buffer deadlock
  let o_child = o_command.spawn();
  let o_decoder = new TextDecoder();

  let a_n_byte__stderr = [];
  let o_reader__stderr = o_child.stderr.getReader();
  let s_line_buf = '';

  let f_read_stderr = async function(){
    while(true){
      let { done, value } = await o_reader__stderr.read();
      if(done) break;
      a_n_byte__stderr.push(value);
      s_line_buf += o_decoder.decode(value, { stream: true });
      let a_s_line = s_line_buf.split('\n');
      s_line_buf = a_s_line.pop();
      for(let s_line of a_s_line){
        let s_trimmed = s_line.trim();
        if(s_trimmed.length > 0){
          console.log('Python:', s_trimmed);
          if(f_on_progress && s_trimmed.startsWith('Processing ')){
            f_on_progress('pose estimation: ' + s_trimmed);
          }
        }
      }
    }
  };

  let a_n_byte__stdout = [];
  let o_reader__stdout = o_child.stdout.getReader();

  let f_read_stdout = async function(){
    while(true){
      let { done, value } = await o_reader__stdout.read();
      if(done) break;
      a_n_byte__stdout.push(value);
    }
  };

  let [_, __, o_status] = await Promise.all([f_read_stderr(), f_read_stdout(), o_child.status]);

  if(!o_status.success){
    let s_stderr = a_n_byte__stderr.map(function(v){ return o_decoder.decode(v); }).join('');
    throw new Error('Python pose estimation failed: ' + s_stderr);
  }

  let s_stdout = a_n_byte__stdout.map(function(v){ return o_decoder.decode(v); }).join('').trim();
  let o_result_json = JSON.parse(s_stdout);

  // store results in db
  let n_len__result = o_result_json.results.length;
  for(let n_idx = 0; n_idx < n_len__result; n_idx++){
    let o_result = o_result_json.results[n_idx];
    if(!o_result.success) continue;
    if(f_on_progress) f_on_progress('storing results: ' + (n_idx + 1) + '/' + n_len__result);

    // find the matching o_image by path
    let o_image = a_o_image__to_process.find(function(o){
      return o.s_path_absolute === o_result.image_path;
    });
    if(!o_image) continue;

    // each person detected becomes one o_pose
    for(let o_person of o_result.people){
      let o_pose = f_o_model_instance(o_model__o_pose, {
        n_id: null,
        n_o_image_n_id: o_image.n_id,
      });
      let o_pose__created = f_v_crud__indb('create', o_model__o_pose, o_pose);

      let a_o_posekeypoint = [];
      for(let o_kp of o_person.keypoints){
        let o_posekeypoint = f_o_model_instance(o_model__o_posekeypoint, {
          n_id: null,
          n_o_pose_n_id: o_pose__created.n_id,
          s_name: o_kp.name,
          n_trn_x: o_kp.x,
          n_trn_y: o_kp.y,
          n_confidence: o_kp.confidence,
        });
        let o_posekeypoint__created = f_v_crud__indb('create', o_model__o_posekeypoint, o_posekeypoint);
        a_o_posekeypoint.push(o_posekeypoint__created);
      }

      o_pose__created.a_o_posekeypoint = a_o_posekeypoint;
      a_o_pose__result.push(o_pose__created);
    }
  }

  return a_o_pose__result;
}

export {
  f_s_filetype_from_s_path_abs,
  f_o_info__image,
  f_o_info__video,
  f_a_o_pose_from_a_o_img,
  f_download_vitpose_model,
}