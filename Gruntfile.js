module.exports = function (grunt) {

    grunt.initConfig({
        clean: {
            tmp: ['tmp'],
            dist: ['dist'],
            gh_pages: ['gh-pages']
        },
        concat: {
            bs_css: {
                src: ['tmp/bs-base2.css', 'tmp/bs-extra.css'],
                dest: 'dist/math-ui-twbs.css'
            },
            math_ui: {
                src: ['tmp/math-ui.js', 'tmp/bootstrap.js'],
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
                        return 'FlorianMath.requireLibs().then(function (jQuery) {\n' +
                            content.replace(/modal-open/g, 'math-ui-modal-open') +
                            'console.log("Loaded Bootstrap modal");  });\n';
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
                    {
                        expand: true,
                        src: [
                            'bower_components/math-item/*.js',
                            'bower_components/math-item/*.js.map',
                            'bower_components/webcomponentsjs/webcomponents.js',
                            'fonts/**',
                            'examples/**',
                            'dist/**',
                            'media/**'
                        ],
                        dest: 'gh-pages/'
                    }
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
                files: ['src/requirelibs.ts', 'src/math-ui.ts'],
                tasks: ['typescript:math_ui', 'concat:math_ui']
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
    grunt.registerTask('gh-pages', ['clean:gh_pages', 'copy:gh_pages']);

};
