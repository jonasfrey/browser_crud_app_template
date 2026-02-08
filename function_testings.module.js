import { assertEquals } from "jsr:@std/assert";
import { f_o_info__image } from "./fileinfo_api.module.js";

Deno.test("simple test", () => {
  const x = 1 + 2;
  assertEquals(x, 3);
});



Deno.test({
  name: "get file info from absolute path",
  fn: async () => {
    //download image 
    let s_path = "./.gitignored/text_test.txt";
    await Deno.writeTextFile(s_path, "Hello, world!");
    let o_info = await f_o_fileinfo_from_s_path_abs(s_path);
    console.log(o_info)
    assertEquals(o_info.type, "unknown");
  },
});

Deno.test({
  name: "get file info from absolute path",
  fn: async () => {
    //make sure testdata exists
    let s_url_img = "http://farm9.staticflickr.com/8108/8567991438_2120347ef0_z.jpg"; 
    //download image 
    let s_path_img = "./.gitignored/8567991438_2120347ef0_z.jpg";
    Deno.writeFileSync(s_path_img, new Uint8Array(await (await fetch(s_url_img)).arrayBuffer()));
    let o_info = await f_o_info__image(s_path_img);
    console.log(o_info)
    assertEquals(o_info.width, 639);
    assertEquals(o_info.height, 384);
  },
});
