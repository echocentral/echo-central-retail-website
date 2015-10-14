module.exports = function(grunt) {

  var merge = require("merge");
  require('dotenv').load({silent: true});

  var includes = ["**/*", "!**/_*.html"];

  var config = {
    pkg: grunt.file.readJSON("package.json"),
    clean: ["build", "app/*", "dist"],
    copy: {
      stage: {
        files: [{
          expand: true,
          cwd: "src",
          src: ["**/*"],
          dest: "build/stage"
        }]
      },
      publish: {
        files: [{
          expand: true,
          cwd: "build/stage",
          src: includes,
          dest: "app"
        }]
      },
    }
  }

  merge(config, {
    express: {
      all: {
        options: {
          port: 9000,
          bases: ["app"],
          livereload: true
        }
      }
    },
    open: {
      all: {
        path: 'http://localhost:<%= express.all.options.port%>'
      }
    },
    watch: {
      src: {
        files: ['src/**/*', 'bower_components/**/*'],
        tasks: ['copy:stage', "do-setup", "do-validate", "do-build", "copy:publish"]
      }
    }
  });
  merge(config, {
    swig: {
      dist: {
        init: {
          autoescape: true
        },
        dest: "build/stage/",
        src: ['*.html', '!_*.html'],
        cwd: 'build/stage/',
        generateSitemap: false,
        generateRobotstxt: false,
        production: false,
      }
    }
  });
  merge(config, {
    compress: {
      main: {
        options: {
          mode: 'gzip'
        },
        expand: true,
        cwd: 'app/',
        src: ['**/*'],
        dest: 'dist/'
      }
    }
  });
  merge(config, {
    aws_s3: {
      options: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        uploadConcurrency: 5
      },
      dist: {
        options: {
          region: 'eu-west-1',
          bucket: 'echo-central.com',
          differential: true,
          displayChangesOnly: true,
          params: {
            ContentEncoding: "gzip"
          }
        },
        files: [{
          expand: true,
          dest: '/',
          cwd: 'dist',
          src: ["**/*"]
        }]
      }
    }
  });
  //<humphrey:config:insert>//

  grunt.initConfig(config);

  require("load-grunt-tasks")(grunt);

  grunt.registerTask("do-serve", ["build", "express", "open", "watch"]);
  grunt.registerTask("do-swig", ["swig"]);
  grunt.registerTask("do-compress", ["compress"]);
  grunt.registerTask("do-aws_s3", ["aws_s3"]);
  //<humphrey:subtask:insert>//

  grunt.registerTask("do-setup", []);
  grunt.registerTask("do-validate", []);
  grunt.registerTask("do-build", ["do-swig"]);
  grunt.registerTask("do-test", []);
  grunt.registerTask("do-package", ["do-compress"]);
  grunt.registerTask("do-archive", []);
  grunt.registerTask("do-deploy", ["do-aws_s3"]);

  grunt.registerTask("setup", ["clean", "copy:stage", "do-setup"]);
  grunt.registerTask("validate", ["setup", "do-validate"]);
  grunt.registerTask("build", ["validate", "do-build", "copy:publish"]);
  grunt.registerTask("test", ["build", "do-test"]);
  grunt.registerTask("package", ["test", "do-package"]);
  grunt.registerTask("archive", ["package", "do-archive"]);
  grunt.registerTask("deploy", ["archive", "do-deploy"]);

  grunt.registerTask("serve", ["do-serve"]);
  //<humphrey:task:insert>//

  grunt.registerTask("default", ["test"]);

};