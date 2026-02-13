import { assertEquals } from "jsr:@std/assert";
import { f_o_info__image } from "./fileinfo_api.module.js";

Deno.test("simple test", () => {
  const x = 1 + 2;
  assertEquals(x, 3);
});