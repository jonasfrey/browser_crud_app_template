
import {
    f_v_crud__indb,
} from "./database_functions.module.js";
import {
    f_o_model_instance,
    o_model__o_fsnode,
    o_model__o_image,
    o_model__o_pose,
    o_model__o_posekeypoint,
} from "./webserved_dir/constructors.module.js";

import {
    s_ds,
    s_root_dir
} from "./runtimedata.module.js";
import { 
    f_o_info__image, 
    f_o_info__video, 
    f_s_filetype_from_s_path_abs
} from "./command_api.module.js";

let f_download_urls_to_dir = async function(a_s_url, s_path_dir) {
    try {
        await Deno.mkdir(s_path_dir, { recursive: true });
    } catch (o_error) {
        if (o_error instanceof Deno.errors.AlreadyExists) {
            console.log(`Directory already exists: ${s_path_dir}`);
        } else {
            console.error(`Error creating directory: ${s_path_dir}`, o_error.message);
            return;
        }
    }

    for(let s_url of a_s_url){
        let s_name_file = s_path_dir + s_ds + s_url.split('/').at(-1);
        // check if file exists
        try {
            await Deno.stat(s_name_file);
            console.log(`File already exists: ${s_name_file}`);
            continue;
        } catch (o_error) {
            if (!(o_error instanceof Deno.errors.NotFound)) {
                console.error(`Error checking file: ${s_name_file}`, o_error.message);
                continue;
            }
        }
        try {
            let o_response = await fetch(s_url);
            if (!o_response.ok) {
                throw new Error(`Failed to download ${s_url}: ${o_response.statusText}`);
            }
            let a_n_byte = new Uint8Array(await o_response.arrayBuffer());
            await Deno.writeFile(s_name_file, a_n_byte);
            console.log(`Downloaded and saved: ${s_url}`);
        }
        catch (o_error) {
            console.error(`Error downloading ${s_url}:`, o_error.message);
        }
    }
}
let f_unzip_with_progress = async function(s_path_zip) {
        try {
        console.log('Starting unzip...');
        
        const command = new Deno.Command('unzip', {
            args: [s_path_zip, '-d', `${s_root_dir}${s_ds}.gitignored${s_ds}COCO`],
            stdout: 'piped',
            stderr: 'piped'
        });
        
        const process = command.spawn();
        const { code, stdout, stderr } = await process.output();
        
        if (code === 0) {
            console.log(`✓ Unzipped successfully: ${s_path_zip}`);
        } else {
            const errorString = new TextDecoder().decode(stderr);
            console.error(`Error unzipping ${s_path_zip}:`, errorString);
        }
    } catch (o_error) {
        console.error(`Error unzipping ${s_path_zip}:`, o_error.message);
    }

    let n_files_to_keep = 500;
    // only keep the first 500 images in val2017 to save disk space
    let s_path_val2017 = `${s_root_dir}${s_ds}.gitignored${s_ds}COCO${s_ds}val2017`;
    try {
        let n_count = 0;
        for await (let o_dir_entry of Deno.readDir(s_path_val2017)) {
            if (n_count >= n_files_to_keep) {
                // delete the rest of the files
                let s_path_file = `${s_path_val2017}${s_ds}${o_dir_entry.name}`;
                await Deno.remove(s_path_file);
            } else {
                n_count++;
            }
        }
        console.log('✓ Kept only the first 1000 images in val2017');
    } catch (o_error) {
        console.error(`Error processing ${s_path_val2017}:`, o_error.message);
    }
}
let f_create_test_data = async function() {

    //convert this to javascript 
    // # https://cocodataset.org/#explore
    // # to customize test data go to 
    // # document.querySelectorAll('.exploreIconImage').forEach(o=>{o.click()})
    // # let a_o = Array.from(document.querySelectorAll('.url'));
    // # let a_s = a_o.map(o=>{return o.querySelectorAll('a')?.[1]?.getAttribute('href')})
    // # console.log(a_s.map(s=>{

    // #     return `wget ${s}`
    // # }).join('\n'))

    // mkdir -p .gitignored
    // mkdir -p .gitignored/COCO
    // cd .gitignored/COCO

    // make directory if not extists
    let s_name_dir = `${s_root_dir}${s_ds}.gitignored${s_ds}COCO${s_ds}set1`;


    let a_s_imgurl = [
        'http://farm9.staticflickr.com/8108/8567991438_2120347ef0_z.jpg',
        'http://farm3.staticflickr.com/2576/3984089292_8f2f32f26d_z.jpg',
        'http://farm9.staticflickr.com/8026/7624155454_d761fa7029_z.jpg',
        'http://farm4.staticflickr.com/3466/3249001308_303dd36d39_z.jpg',
        'http://farm7.staticflickr.com/6129/6014215204_1d8e38ac7f_z.jpg',
        'http://farm2.staticflickr.com/1087/5127094326_9d7c66bf7e_z.jpg',
        'http://farm6.staticflickr.com/5280/7383345544_450dd545ec_z.jpg',
        'http://farm6.staticflickr.com/5548/9448296519_50caff6b5e_z.jpg',
        'http://farm3.staticflickr.com/2635/4005560155_710444f4c1_z.jpg',
        'http://farm9.staticflickr.com/8115/8863191321_9dff99e5df_z.jpg',
    ];
    await f_download_urls_to_dir(a_s_imgurl, s_name_dir);
    let s_name_dir2 = `${s_root_dir}${s_ds}.gitignored${s_ds}COCO${s_ds}set2`;

    let a_s_imgurl2 = [
        'http://farm4.staticflickr.com/3584/3555538042_0907703331_z.jpg',
        'http://farm7.staticflickr.com/6061/6048607052_25caf5f9df_z.jpg',
        'http://farm1.staticflickr.com/122/287689148_48fd3a53bf_z.jpg',
        'http://farm8.staticflickr.com/7041/7031590667_6452f2405c_z.jpg',
        'http://farm3.staticflickr.com/2207/2364188930_6e04dbccc4_z.jpg',
        'http://farm5.staticflickr.com/4135/4893869887_c726d3377c_z.jpg',
        'http://farm4.staticflickr.com/3524/3957893927_5d9f4f134c_z.jpg',
        'http://farm9.staticflickr.com/8092/8567026638_901eecddff_z.jpg',
        'http://farm5.staticflickr.com/4142/4939975874_b8c3b5a528_z.jpg',
        'http://farm6.staticflickr.com/5288/5277576520_2fef06a88e_z.jpg',
        'http://farm7.staticflickr.com/6167/6139137160_c570e027fa_z.jpg',
        'http://farm5.staticflickr.com/4020/4395778587_9b92f76b94_z.jpg',
        'http://farm5.staticflickr.com/4121/4929319058_b9465bb06d_z.jpg',
        'http://farm8.staticflickr.com/7080/7068638949_4dc78122d3_z.jpg',
        'http://farm4.staticflickr.com/3538/3411299560_c4100e0f42_z.jpg',
        'http://farm6.staticflickr.com/5055/5532642910_b9dc9c0fcc_z.jpg',
        'http://farm9.staticflickr.com/8299/7780500820_f3e779b9ec_z.jpg',
        'http://farm3.staticflickr.com/2736/5807400545_381b0a1b90_z.jpg',
        'http://farm4.staticflickr.com/3408/3426872078_32ebe54029_z.jpg',
        'http://farm8.staticflickr.com/7234/7158082344_b31b762e39_z.jpg',
        'http://farm9.staticflickr.com/8074/8448620367_0d0de02c03_z.jpg',
        'http://farm3.staticflickr.com/2335/5813982948_8e311d7f01_z.jpg',
    ];
    await f_download_urls_to_dir(a_s_imgurl2, s_name_dir2);
    let s_name_dir3 = `${s_root_dir}${s_ds}.gitignored${s_ds}COCO${s_ds}set3`;
    let a_s_imgurl3 = [
        'http://farm9.staticflickr.com/8472/8404797851_d267e1a955_z.jpg',
        'http://farm7.staticflickr.com/6223/6257358248_44ba4bc372_z.jpg',
        'http://farm1.staticflickr.com/37/89910096_9de0302c95_z.jpg',
        'http://farm3.staticflickr.com/2342/1794334693_c3e27b61dd_z.jpg',
        'http://farm8.staticflickr.com/7333/8723844204_cf547e66f7_z.jpg',
        'http://farm9.staticflickr.com/8291/7863104848_03b72a492f_z.jpg',
        'http://farm5.staticflickr.com/4048/4580509428_31cd599f02_z.jpg',
        'http://farm4.staticflickr.com/3026/3082373828_727ef08aa8_z.jpg',
        'http://farm3.staticflickr.com/2740/4509181536_8fa90d8afa_z.jpg',
        'http://farm3.staticflickr.com/2826/9676760985_b5ba815ca2_z.jpg',
        'http://farm8.staticflickr.com/7432/9391402776_7a9d369e13_z.jpg',
        'http://farm4.staticflickr.com/3034/2659008715_99ebcb51fe_z.jpg',
        'http://farm6.staticflickr.com/5059/5484391275_3b9d1045c3_z.jpg',
        'http://farm4.staticflickr.com/3248/2743655825_0096d474f2_z.jpg',
        'http://farm1.staticflickr.com/101/306988148_cb9dc66608_z.jpg',
        'http://farm5.staticflickr.com/4122/4869287384_949c9c1e70_z.jpg',
        'http://farm9.staticflickr.com/8453/8067283606_68f96ab4e6_z.jpg',
        'http://farm4.staticflickr.com/3532/3823402611_77cea8e2e4_z.jpg',
        'http://farm8.staticflickr.com/7157/6582231629_a7a6175249_z.jpg',
        'http://farm8.staticflickr.com/7021/6469239351_997890b8be_z.jpg',
        'http://farm3.staticflickr.com/2276/2197048142_02531c1caa_z.jpg',
    ]; 
    await f_download_urls_to_dir(a_s_imgurl3, s_name_dir3);

    // Download zip with progress
    let s_url_zip = 'http://images.cocodataset.org/zips/val2017.zip';
    let s_path_zip = `${s_root_dir}${s_ds}.gitignored${s_ds}COCO${s_ds}val2017.zip`;

    //check if file exists
    try {
        await Deno.stat(s_path_zip);
        console.log(`File already exists: ${s_path_zip}`);
    } catch (o_error) {
        if (o_error instanceof Deno.errors.NotFound) {
            console.log(`File does not exist, starting download: ${s_path_zip}`);
            try {
                let o_response = await fetch(s_url_zip);
                if (!o_response.ok) {
                    throw new Error(`Failed to download ${s_url_zip}: ${o_response.statusText}`);
                }
                
                // Get total file size
                const n_total_bytes = parseInt(o_response.headers.get('content-length') || '0');
                const reader = o_response.body.getReader();
                
                // Open file for writing
                const file = await Deno.open(s_path_zip, { write: true, create: true });
                
                let n_downloaded_bytes = 0;
                let n_last_percent = 0;
                
                while (true) {
                    const { done, value } = await reader.read();
                    
                    if (done) break;
                    
                    // Write chunk to file
                    await file.write(value);
                    
                    // Update progress
                    n_downloaded_bytes += value.length;
                    const n_percent = Math.floor((n_downloaded_bytes / n_total_bytes) * 100);
                    
                    // Only log when percentage changes (avoid spam)
                    if (n_percent !== n_last_percent) {
                        const n_mb_downloaded = (n_downloaded_bytes / 1024 / 1024).toFixed(2);
                        const n_mb_total = (n_total_bytes / 1024 / 1024).toFixed(2);
                        console.log(`Downloading large image dataset: ${n_percent}% (${n_mb_downloaded}MB / ${n_mb_total}MB)`);
                        n_last_percent = n_percent;
                    }
                }
                
                file.close();
                console.log(`✓ Downloaded and saved: ${s_path_zip}`);
                
            } catch (o_error) {
                console.error(`Error downloading ${s_url_zip}:`, o_error.message);
            }

        } else {
            console.error(`Error checking file: ${s_path_zip}`, o_error.message);
            return;
        }
    }

    // Unzip using Deno.Command (modern API, Deno.run is deprecated)
    // check if unziped folder exists
    let s_path_unzipped = `${s_root_dir}${s_ds}.gitignored${s_ds}COCO${s_ds}val2017`;
    try {
        await Deno.stat(s_path_unzipped);
        console.log(`Unzipped folder already exists: ${s_path_unzipped}`);
    } catch (o_error) {
        if (o_error instanceof Deno.errors.NotFound) {
            console.log(`Unzipped folder does not exist, starting unzip: ${s_path_unzipped}`);
            await f_unzip_with_progress(s_path_zip);
        } else {
            console.error(`Error checking unzipped folder: ${s_path_unzipped}`, o_error.message);
            return;
        }
    }


}
let f_a_o_fsnode__from_path_recursive = async function(s_path, o_fsnode_parent = null, f_on_progress = null) {
    let a_o = [];

    // to prevent error Error reading directory: /home/jonas/asdf Cannot read properties of undefined (reading 'split')
    // we have to check if s_path is defined and not empty
    if (!s_path) {
        console.error('Invalid path:', s_path);
        return a_o;
    }
    // and we have to check if s_path is absolute, because Deno.readDir only works with absolute paths
    if (!s_path.startsWith(s_ds)) {
        console.error('Path is not absolute:', s_path);
        return a_o;
    }

    try {
        for await (let o_dir_entry of Deno.readDir(s_path)) {
            // console.log(o_dir_entry)
            let s_path_absolute = `${s_path}${s_ds}${o_dir_entry.name}`;
            // get size 
            let o_stat = await Deno.stat(s_path_absolute);
            // console.log(o_stat)
            if(f_on_progress) f_on_progress('scanning: ' + o_dir_entry.name);
            let s_filetype = (!o_dir_entry.isDirectory) ? await f_s_filetype_from_s_path_abs(s_path_absolute) : "unknown";

            let b_image = s_filetype === 'image';
            let b_video = s_filetype === 'video';

            let o_fsnode = f_o_model_instance(
                o_model__o_fsnode, 
                {
                    s_path_absolute,
                    s_name: o_dir_entry.name,
                    n_bytes: o_stat.size,
                    b_folder: o_dir_entry.isDirectory,
                    n_o_fsnode_n_id: o_fsnode_parent?.n_id || null,
                    b_image,
                    b_video
                }
        );
           
            let o_fsnode__fromdb = (
                await f_v_crud__indb(
                    'read', 
                    o_model__o_fsnode, 
                    {
                        n_bytes: o_fsnode.n_bytes,
                        s_name: o_dir_entry.name,
                     }
                ))?.at(0);
            if (o_fsnode__fromdb) {
                o_fsnode.n_id = o_fsnode__fromdb.n_id;
            }else{
                let o_fsnode__created = await f_v_crud__indb(
                    'create', 
                    o_model__o_fsnode, 
                    o_fsnode
                );
                o_fsnode.n_id = o_fsnode__created.n_id; 
            }
            // console.log(o_fsnode__fromdb)

            o_fsnode.s_name = o_fsnode.s_path_absolute.split(s_ds).at(-1);

            if(b_image){
                if(f_on_progress) f_on_progress('extracting image metadata: ' + o_dir_entry.name);
                let o_image__fromdb = await f_o_image__from_o_fsnode(o_fsnode);
                o_fsnode.o_image__fromdb = o_image__fromdb;
            }
            if(b_video){
                if(f_on_progress) f_on_progress('extracting video metadata: ' + o_dir_entry.name);
                let o_video__fromdb = await f_o_video__from_o_fsnode(o_fsnode);
                o_fsnode.o_video__fromdb = o_video__fromdb;
            }

            if (o_dir_entry.isDirectory) {
                o_fsnode.a_o_fsnode = await f_a_o_fsnode__from_path_recursive(s_path_absolute, o_fsnode, f_on_progress);
            }

            a_o.push(o_fsnode);
        }
    } catch (o_error) {
        console.error(`Error reading directory: ${s_path}`, o_error.message);
        console.error(o_error);
        // show full backtrace of error
        console.error(o_error.stack);
    }

    a_o.sort(function(o_a, o_b) {
        if (o_a.s_type === o_b.s_type) return o_a.s_name.localeCompare(o_b.s_name);
        return o_a.s_type === 'directory' ? -1 : 1;
    });

    return a_o;
};


let f_o_video__from_o_fsnode = async function(o_fsnode) {

    let o_video__fromdb = f_v_crud__indb(
        'read',
        o_model__o_video,
        {
            n_o_fsnode_n_id: o_fsnode.n_id,
        }
    )?.at(0);
    if(o_video__fromdb){
        console.log('found video in db')
        return o_video__fromdb;
    }

    let o_fileinfo = await f_o_info__video(o_fsnode.s_path_absolute);
    let o_video = f_o_model_instance(
        o_model__o_video,
        {
            n_o_fsnode_n_id: o_fsnode.n_id,
            n_ms_duration: o_fileinfo.duration,
            n_scl_x: o_fileinfo.width,
            n_scl_y: o_fileinfo.height,
            s_codec: o_fileinfo.codec,
            s_fps: o_fileinfo.fps,
            n_bitrate: o_fileinfo.bitrate,
            n_size:    o_fileinfo.size,
            s_format: o_fileinfo.format,
        }
    );
    o_video__fromdb = await f_v_crud__indb(
        'create',
        o_model__o_video,
        o_video
    );
    return o_video__fromdb;
}

let f_o_image__from_o_fsnode = async function(o_fsnode) {

    let o_image__fromdb = f_v_crud__indb(
        'read',
        o_model__o_image,
        {
            n_o_fsnode_n_id: o_fsnode.n_id,
        }
    )?.at(0);
    if(o_image__fromdb){
        console.log('found image in db')
        return o_image__fromdb;
    }

    let o_fileinfo = await f_o_info__image(o_fsnode.s_path_absolute);
    console.log(o_fileinfo)
    let o_image = f_o_model_instance(
        o_model__o_image,
        {
            n_o_fsnode_n_id: o_fsnode.n_id,
            n_scl_x: o_fileinfo.width,
            n_scl_y: o_fileinfo.height,
        }
    );
    o_image__fromdb = await f_v_crud__indb(
        'create',
        o_model__o_image,
        o_image
    );
    return o_image__fromdb;
}

let f_a_o_image__with_pose = function() {
    let a_o_image = f_v_crud__indb('read', o_model__o_image, {});
    let a_o_result = [];
    for (let o_image of a_o_image) {
        let o_fsnode = f_v_crud__indb('read', o_model__o_fsnode, { n_id: o_image.n_o_fsnode_n_id })?.at(0);
        if (!o_fsnode) continue;
        let a_o_pose = f_v_crud__indb('read', o_model__o_pose, { n_o_image_n_id: o_image.n_id }) || [];
        for (let o_pose of a_o_pose) {
            o_pose.a_o_posekeypoint = f_v_crud__indb('read', o_model__o_posekeypoint, { n_o_pose_n_id: o_pose.n_id }) || [];
        }
        a_o_result.push({
            o_image,
            o_fsnode,
            a_o_pose,
        });
    }
    return a_o_result;
}

export {
    f_a_o_fsnode__from_path_recursive,
    f_create_test_data,
    f_a_o_image__with_pose,
};
