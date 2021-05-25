// Global vars
var deferral, fs, elementtree, path;

var disableAllowBackup = (function () {

    var disableAllowBackup = {};

    var manifestPaths = {
        cordovaAndroid6: "platforms/android/AndroidManifest.xml",
        cordovaAndroid7: "platforms/android/app/src/main/AndroidManifest.xml"
    };

    var rootDir;

    disableAllowBackup.fileExists = function (filePath) {
        try {
            return fs.statSync(filePath).isFile();
        } catch (error) {
            return false;
        }
    };

    disableAllowBackup.parseElementtreeSync = function (filename) {
        var content = fs.readFileSync(filename, 'utf-8');
        return new elementtree.ElementTree(elementtree.XML(content));
    };

    disableAllowBackup.getAndroidManifestPath = function () {
        var cordovaAndroid6Path = path.join(rootDir, manifestPaths.cordovaAndroid6);
        var cordovaAndroid7Path = path.join(rootDir, manifestPaths.cordovaAndroid7);

        if (this.fileExists(cordovaAndroid6Path)) {
            return cordovaAndroid6Path;
        } else if (this.fileExists(cordovaAndroid7Path)) {
            return cordovaAndroid7Path;
        } else {
            return undefined;
        }
    };


    disableAllowBackup.apply = function (ctx) {
        debugger;
        rootDir = ctx.opts.projectRoot;

        var androidManifestPath = this.getAndroidManifestPath();
        if(!androidManifestPath) {
            throw new Error("Unable to find AndroidManifest.xml");
        }
        
        var manifestTree = this.parseElementtreeSync(androidManifestPath);
        var root = manifestTree.getroot();

        if (root) {
			root.set("xmlns:tools", "http://schemas.android.com/tools");
			
			root._children.forEach(function(item) {
				if(item.tag === 'uses-feature') {
					item.set('android:required','true');
					item.set('tools:node', 'merge');
				}
				
				if(item.tag === 'uses-permission') {
					item.set('tools:node', 'merge');
				}
			});
				
            fs.writeFileSync(androidManifestPath, manifestTree.write({indent:4}, 'utf-8'));
        } else {
            throw new Error("Invalid AndroidManifest.xml structure. No <manifest> tag found.");
        }
    };

    return disableAllowBackup;
})();

module.exports = function (ctx) {
    var q = require('q');
    var FS = require('fs');
    var PATH = require('path');
    var ELEMENTTREE = require('elementtree');
    var Q = ctx.q;
    fs = ctx.FS;
    path = ctx.PATH;
    elementtree = ctx.ELEMENTTREE;

    deferral = Q.defer();

    try {
        disableAllowBackup.apply(ctx);
        deferral.resolve();
    } catch (error) {
        deferral.reject(error);
        return deferral.promise;
    }

    return deferral.promise;
};
