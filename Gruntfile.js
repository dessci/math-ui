module.exports = function(grunt) {

    grunt.initConfig({
        clean: {
            tmp: ['tmp'],
            dist: ['dist']
        },
        concat: {
            bs_css: {
                src: ['tmp/bs-base.css', 'tmp/bs-extra.css'],
                dest: 'dist/math-ui-twbs.css'
            },
            math_item: {
                src: ['libs/math-item/math-item-element.js', 'tmp/loader.js'],
                dest: 'dist/math-item-twbs.js'
            },
            math_ui: {
                src: ['tmp/bootstrap.js', 'tmp/math-ui.js'],
                dest: 'dist/math-ui-twbs.js'
            }
        },
        connect: {
            root: {
                options: {
                    port: 8080,
                    base: './'
                }
            }
        },
        copy: {
            bs_js: {
                src: 'libs/bootstrap/bootstrap.js',
                dest: 'tmp/bootstrap.js',
                options: {
                    process: function (content) {
                        return '(function (jQuery) {\n' + content + '})(FlorianMath.jQueryLib);\n';
                    }
                }
            }
        },
        exec: {
            bs_css: 'node convert.js libs/bootstrap/bootstrap.css > tmp/bs-base.css'
        },
        mkdir: {
            tmp: {
                options: {
                    create: ['tmp']
                }
            }
        },
        sass: {
            bs_extra: {
                files: {
                    'tmp/bs-extra.css': 'src/bootstrap-extra.scss'
                }
            }
        },
        typescript: {
            math_item: {
                src: ['src/loader.ts'],
                dest: 'tmp/loader.js',
                options: {
                    target: 'es3',
                    declaration: true
                }
            },
            math_ui: {
                src: ['src/math-ui.ts'],
                dest: 'tmp/math-ui.js',
                options: {
                    target: 'es3'
                }
            }
        },
        watch: {
            math_ui: {
                files: ['src/math-ui.ts'],
                tasks: ['typescript:math_ui', 'concat:math_ui']
            },
            bs_css: {
                files: ['src/bootstrap-extra.scss', 'libs/bootstrap/bootstrap.css'],
                tasks: ['sass:bs_extra', 'exec:bs_css', 'concat:bs_css']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-mkdir');
    grunt.loadNpmTasks('grunt-typescript');

    grunt.registerTask('default', ['clean', 'mkdir', 'exec', 'sass', 'typescript', 'copy', 'concat']);
    grunt.registerTask('serve', ['connect', 'watch']);

};
