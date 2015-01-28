module.exports = function(grunt) {

    grunt.initConfig({
        clean: {
            tmp: ['tmp'],
            dist: ['dist']
        },
        concat: {
            bs_css: {
                src: ['tmp/bs-base2.css', 'tmp/bs-extra.css'],
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
                        return '(function (jQuery) {\n' + content.replace(/modal-open/g, 'math-ui-modal-open') +
                            '})(FlorianMath.jQueryLib);\n';
                    }
                }
            },
            bs_css: {
                src: 'tmp/bs-base1.css',
                dest: 'tmp/bs-base2.css',
                options: {
                    process: function (content) {
                        content = content.replace(/^(\.math-ui \.modal-dialog \{[^]*?margin:.*?)(;[^]*?\})/m,
                            '$1 0;\n  max-width: 100vw$2');
                        return content.replace(/\.math-ui \.modal-open/g, '.math-ui-modal-open');
                    }
                }
            },
            gh_pages: {
                files: [
                    { expand: true, src: ['dist/**'], dest: 'gh-pages/' },
                    { expand: true, src: ['examples/**'], dest: 'gh-pages/' },
                    { expand: true, src: ['media/**'], dest: 'gh-pages/' }
                ]
            }
        },
        exec: {
            bs_css: 'node convert.js libs/bootstrap/bootstrap.css > tmp/bs-base1.css'
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
            math_item: {
                files: ['src/loader.ts'],
                tasks: ['typescript:math_item', 'concat:math_item']
            },
            math_item_element: {
                files: ['libs/math-item/math-item-element.js'],
                tasks: ['concat:math_item']
            },
            bs_js: {
                files: ['libs/bootstrap/bootstrap.js'],
                tasks: ['copy:bs_js', 'concat:math_ui']
            },
            bs_extra: {
                files: ['src/bootstrap-extra.scss'],
                tasks: ['sass:bs_extra', 'concat:bs_css']
            },
            bs_css: {
                files: ['libs/bootstrap/bootstrap.css'],
                tasks: ['exec:bs_css', 'copy:bs_css', 'concat:bs_css']
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
    grunt.registerTask('gh-pages', ['copy:gh_pages']);

};
