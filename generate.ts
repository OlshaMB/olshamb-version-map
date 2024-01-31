import git from "npm:isomorphic-git";
import http from "npm:isomorphic-git/http/web/index.js"
import fs from "node:fs";
import { existsSync } from "https://deno.land/std@0.213.0/fs/exists.ts";
import ProgressBar from "https://deno.land/x/progress@v1.4.4/mod.ts";
const dir = Deno.cwd() +"/" + "zig-site";
if (existsSync(dir)) Deno.removeSync(dir, {
    recursive: true
});
await git.clone({
    fs,
    http,
    dir,
    url: "https://github.com/ziglang/www.ziglang.org.git",
    singleBranch: true,
    ref: "master"
})
const commits = (await git.log({
    fs,
    dir,
    filepath: "data/releases.json",
}))
    .sort((a,b)=>a.commit.author.timestamp-b.commit.author.timestamp)
    .filter(v=>v.commit.author.email=="ziggy@ziglang.org")
    .toReversed()
const map: any = {}
const title = "commit -> struct:";
const total = commits.length;
const progress = new ProgressBar({
  title,
  total,
});
let completed = 0;
for (const commit of commits) {
    await progress.render(completed++);
    try {
        const currentMap = JSON.parse(new TextDecoder().decode((await git.readBlob({fs, dir, oid: (await git.resolveRef({ fs, dir, ref: commit.oid})), filepath: "data/releases.json"})).blob));
        map[currentMap.master.version] = currentMap.master
    } catch (error) {
        console.log(error)
    }
}

Deno.writeFileSync(Deno.cwd()+"/map.json",new TextEncoder().encode(JSON.stringify(map, undefined, 4)))