'use strict';
var gulp = require('gulp');
var path = require('path');
var fs = require('fs');
var minimist = require('minimist');
var webpack = require('webpack');
var plugins = require('gulp-load-plugins')();
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var options = minimist(process.argv.slice(2));
var gcf = {
	env : options.env || 'prod',
	outDir: 'dist',
	devDir : 'public',
	item: options._[0],
	port: 88
};
var dirs = fs.readdirSync(path.join(__dirname,gcf.devDir));

gulp.task('webpack', function (cb) {
	var bundle = function(err, stats){
		if(err) throw new plugins.util.PluginError("webpack", err);
		plugins.util.log("[webpack]", stats.toString({
			chunks: false,
			colors: true
		}));
		cb();
	};
	var config = require( './'+gcf.devDir + '/'+ gcf.item +'/webpack.config');
	webpack(config,bundle);
});
//将scss 文件生成css文件
gulp.task('sass',function(){
	var config = {};
	if(gcf.env == 'dev'){config.sourceComments = 'map';config.errLogToConsole = true;}
	else if(gcf.env == 'prod'){config.outputStyle = 'compressed';}
	return gulp.src([gcf.devDir + '/**/css/[^_]*.scss','!' + gcf.devDir +'/**/?parts/[^_]*.scss'])
		.pipe(plugins.changed(gcf.outDir,{extension : '.css'}))
		.pipe(plugins.sass(config).on('error', plugins.sass.logError))
		.pipe(plugins.autoprefixer('last 2 version', 'safari 5', 'ie 7', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
		.pipe(gulp.dest(gcf.outDir))
		.pipe(reload({stream: true}))
		.pipe(plugins.notify({message: "css task complete"}));
});

// 清空图片、样式、js
gulp.task('clean', function() {
	var clearDirs = [gcf.outDir+'/'+ gcf.item +'/css/', gcf.outDir+'/'+ gcf.item +'/js/', gcf.outDir+'/'+ gcf.item +'/img/'];
    return gulp.src(clearDirs, {read: false})
        .pipe(plugins.clean({force: true}));
});

gulp.task("fonts",function(){
	return gulp.src(gcf.devDir + '/**/fonts/*')
		.pipe(gulp.dest(gcf.outDir));
})

//将ejs 模块生成html
gulp.task('ejs',function(){
	return gulp.src([gcf.devDir + '/**/[^_]*.ejs','!'+ gcf.devDir + '/**/?parts/[^_]*.ejs'])
		.pipe(plugins.changed(gcf.outDir,{extension: '.html'}))
		.pipe(plugins.ejs({},{ext: '.html'}))
		.pipe(plugins.if(gcf.env=='prod',plugins.minifyHtml({
			quotes:true,
			conditionals:true
		})))
		.pipe(gulp.dest(gcf.outDir))
		.pipe(reload({stream: true}))
		.pipe(plugins.notify({message: "ejs task complete"}));
});
// 图片处理
gulp.task('img', function(){
    gulp.src(gcf.devDir + '/**/img/*')
        .pipe(plugins.imagemin())
        .pipe(gulp.dest(gcf.outDir))
})
gulp.task('serve',['sass','ejs'],function(){
	browserSync({
		notify: false,
		port: gcf.port,
		open: false,
		server:{
			baseDir:gcf.outDir,
			directory:true
		}
	});
	gulp.watch([gcf.outDir + '/**/*.js',gcf.outDir + '/**/fonts/*', gcf.outDir + '/**/img/*']).on('change', reload);
	if(!gcf.item){
		gulp.watch(gcf.devDir + '/' + gcf.item + '/*.js', ['webpack']);
		gulp.watch(gcf.devDir + '/' + gcf.item + '/*.ejs',['ejs']);
		gulp.watch(gcf.devDir + '/' + gcf.item + '/fonts/*',['fonts']);
		gulp.watch(gcf.devDir + '/' + gcf.item + '/img/*',['img']);
	 	gulp.watch(gcf.devDir + '/' + gcf.item + '/*.scss', ['sass']);
	}else{
		gulp.watch(gcf.devDir + '/**/*.js', ['webpack']);
		gulp.watch(gcf.devDir + '/**/*.ejs',['ejs']);
		gulp.watch(gcf.devDir + '/**/fonts/*',['fonts']);
		gulp.watch(gcf.devDir + '/**/img/*',['img']);
	 	gulp.watch(gcf.devDir + '/**/*.scss', ['sass']);
	}
});


dirs.forEach(function(dir){
	gulp.task(dir,['clean'],function(){
		if(gcf.env == 'dev'){
			gulp.start('webpack','sass','ejs','img','fonts');
			gulp.start('serve');
		}else{
			gulp.start('sass','ejs','img','fonts','webpack')
		}
	})
})