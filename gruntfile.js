/*global module:false, require */
module.exports = (function() {

    "use strict";

    var fs = require('fs'),
        stripJSONComments = require('strip-json-comments');

    function readJSON(jsonFile) {
        var data = fs.readFileSync(jsonFile, 'utf8');
        return JSON.parse(stripJSONComments(data));
    }

    // Project Configuration
    return function(grunt) {

        // require it at the top and pass in the grunt instance
        require('time-grunt')(grunt);

        grunt.initConfig({

            pkg: readJSON('package.json'),

            // Project settings
            config: {
                // Configurable paths
                apiPath: 'api',
                apiDistPath: 'api/dist',
                demosPath: 'demos',
                libPath: 'lib',
                docsPath: 'docs',
                testPath: 'test',
                modulesPath: 'node_modules'
            },

            watch: {
                options: {
                    livereload: true,
                },
                css: {
                    files: [
                        '<%= config.apiPath %>/**/*.css',
                        '<%= config.demosPath %>/**/*.css'
                    ],
                    tasks: ['csslint']
                },
                js: {
                    files: [
                        'Gruntfile.js',
                        '<%= config.apiPath %>/**/*.js',
                        '<%= config.libPath %>/**/*.js'
                    ],
                    tasks: ['jshint']
                }
            },

            jshint: {
                options: {
                    jshintrc: '.jshintrc',
                    ignores: [
                        '<%= config.apiPath %>/**/*.min.js'
                    ]
                },
                all: [
                    'Gruntfile.js',
                    '<%= config.apiPath %>/**/*.js',
                    '<%= config.libPath %>/**/*.js',
                    '!<%= config.apiPath %>/**/easyrtc.js',
                ],
                api: [
                    '<%= config.apiPath %>/**/*.js',
                    '!<%= config.apiPath %>/**/easyrtc.js',
                    '!<%= config.apiPath %>/labs/**/*.js'
                ],
                api_ft: [
                    '<%= config.apiPath %>/**/easyrtc_ft.js'
                ],
                labs: [
                    '<%= config.apiPath %>/labs/**/*.js'
                ],
                lib: [
                    '<%= config.libPath %>/**/*.js'
                ]
            },

            csslint: {
                options: {
                    csslintrc: '.csslintrc'
                },
                strict: {
                    options: {
                        import: 2
                    },
                    src: [
                        '<%= config.apiPath %>/**/*.css',
                        '<%= config.demosPath %>/**/*.css'
                    ]
                }
            },

            requirejs: {
                options: {
                    // How to optimize all the JS files in the build output directory.
                    optimize: 'none'
                },
                build_api: {
                    options: {

                        // Name of input file (without the .js extention)
                        name: 'easyrtc',

                        out: 'api/easyrtc.js',

                        paths: {
                             // Don't attempt to include dependencies whose path begins with socket.io/
                            "socket.io": "empty:",
                            // Ditto for the following 3rd-party libraries
                            'webrtc-adapter': '<%= config.modulesPath %>/webrtc-adapter/out/adapter',
                            'easyrtc_lang': '<%= config.apiPath %>/easyrtc_lang',
                            'easyrtc': '<%= config.apiPath %>/easyrtc_int',
                            'easyrtc_app': '<%= config.apiPath %>/easyrtc_app'
                        },

                        deps: ['easyrtc_app']
                    }
                }
            },

            jsdoc : {
                jsdoc: './node_modules/.bin/jsdoc',
                options: {
                    private: false,
                    configure: '<%= config.docsPath %>/conf.json',
                    template: './node_modules/jsdoc-oblivion/template'
                },
                
                client : {
                    src: [
                        '<%= config.apiPath %>/easyrtc_int.js',
                        '<%= config.apiPath %>/easyrtc_ft.js',
                        '<%= config.apiPath %>/easyrtc_app.js',
                        '<%= config.apiPath %>/easyrtc_lang.js',
                        '<%= config.docsPath %>/easyrtc_client_tutorial.md'
                    ],
                    options: {
                        destination: '<%= config.docsPath %>/client_html_docs'
                    }
                },

                server: {
                    src: [
                        '<%= config.libPath %>/easyrtc_public_obj.js',
                        '<%= config.libPath %>/easyrtc_default_event_listeners',
                        '<%= config.docsPath %>/easyrtc_server_install.md'
                    ],
                    options: {
                        destination: '<%= config.docsPath %>/server_html_docs_lite'
                    }
                },
                
                client_lite: {
                    src: [
                        '<%= config.apiPath %>/easyrtc_int.js',
                        '<%= config.apiPath %>/easyrtc_ft.js',
                        '<%= config.apiPath %>/easyrtc_app.js',
                        '<%= config.apiPath %>/easyrtc_lang.js'
                    ],
                    options: {
                        template: 'dev/scripts/client_jsdoc_templates',
                        destination: '<%= config.docsPath %>/client_html_docs_lite'
                    }
                },

                client_ft_lite: {
                    src: [
                        '<%= config.apiPath %>/easyrtc_ft.js'
                    ],
                    options: {
                        template: 'dev/scripts/client_jsdoc_templates2',
                        destination: '<%= config.docsPath %>/client_ft_html_docs_lite'
                    }
                },

                server_lite: {
                    src: [
                        '<%= config.libPath %>/easyrtc_public_obj.js',
                        '<%= config.libPath %>/easyrtc_default_event_listeners'
                    ],
                    options: {
                        destination: '<%= config.docsPath %>/server_html_docs_lite'
                    }
                }
            },

            connect: {
                options: {
                    keepalive: true,
                    open: true,
                    index: 'index.html',
                    maxAge: 0
                },
                dev: {
                    options: {
                        port: 3000,
                        base: '<%= config.demosPath %>'
                    }
                },
                doc: {
                    options: {
                        port: 3005,
                        base: '<%= config.docsPath %>'
                    }
                },
                test_api: {
                    options: {
                        port: 3006,
                        base: ['<%= config.modulesPath %>', '<%= config.apiPath %>', '<%= config.testPath %>/api']
                    }
                }
            },

            karma: {
                test_api: {
                    configFile: '<%= config.testPath %>/api/karma.conf.js'
                }
            },

            file_info: {
                build_api: {
                    src: [
                        '<%= config.apiPath %>/easyrtc_int.js',
                        '<%= config.apiPath %>/easyrtc_lang.js',
                        '<%= config.apiPath %>/easyrtc_ft.js',
                        '<%= config.apiPath %>/easyrtc_app.js',
                        '<%= config.apiPath %>/easyrtc.js', 
                    ],
                    options: {
                        stdout:
                          'Easyrtc              - {{= sizeText(size(src[0]), 7) }}' + grunt.util.linefeed +
                          'Easyrtc Lang         - {{= sizeText(size(src[1]), 7) }}' + grunt.util.linefeed +
                          'Easyrtc FileTransfer - {{= sizeText(size(src[2]), 7) }}' + grunt.util.linefeed +
                          'Easyrtc App          - {{= sizeText(size(src[3]), 7) }}' + grunt.util.linefeed +
                          'Easyrtc Dist         - {{= sizeText(size(src[4]), 7) }}' + grunt.util.linefeed
                    }
                }
            }
        });

        // Making grunt default to force in order not to break the project.
        grunt.option('force', true);

        grunt.loadNpmTasks('grunt-contrib-connect');
        
        grunt.loadNpmTasks('grunt-contrib-watch');
        grunt.loadNpmTasks('grunt-contrib-jshint');
        grunt.loadNpmTasks('grunt-contrib-csslint');

        grunt.loadNpmTasks('grunt-karma');
        grunt.loadNpmTasks('grunt-jsdoc');  
        grunt.loadNpmTasks('grunt-file-info');
        grunt.loadNpmTasks('grunt-contrib-requirejs');

        // Default task(s) and.
        grunt.registerTask('default', ['serve']);
        grunt.registerTask('serve', function (target) {
            target = target || 'dev';
            grunt.task.run(['connect:' + target]);
        });

        // Code QA task(s)
        grunt.registerTask('lint', ['csslint', 'jshint']);
        grunt.registerTask('jslint', ['jshint']);
        grunt.registerTask('csshint', ['csslint']);

        // Build task(s).
        grunt.registerTask('build', ['build_api']);


        grunt.registerTask('build_api', ['requirejs:build_api', 'file_info:build_api']);

        // Test task(s).
        grunt.registerTask('test', ['test:karma']);
        grunt.registerTask('test:karma', ['karma:test_api']);
        grunt.registerTask('test:jasmine', ['serve:test_api']);
    };

}());
