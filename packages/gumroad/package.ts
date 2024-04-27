import fse from "fs-extra";

const cjsPackageJson = { type: "commonjs" };

fse.writeJSONSync("./dist/cjs/package.json", cjsPackageJson, {
	encoding: "utf8"
});

fse.writeJSONSync("./dist/dts/package.json", cjsPackageJson, {
	encoding: "utf8"
});
