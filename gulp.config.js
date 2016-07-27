module.exports = {

  // globbing patterns
  globs: {
    alljs: ['./src/**/*.js', '!./node_modules/'],
    tests: ['./test/*.js'],
    allcss: './src/css/**/*.css',
    allhtml: './src/*.html',
    mainjs: './src/js/app.js',
    maincss: './src/css/main.css',
    allimgs: [
      './src/imgs/*.jpg',
      './src/imgs/*.jpeg',
      './src/imgs/*.gif',
      './src/imgs/*.png'
    ]
  }
}
