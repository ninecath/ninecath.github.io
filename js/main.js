fetch('./data/config.json')
.then(response => response.json())
.then(json => {

  window.document.title = `ascii-creator ${json['title_icons'][json['title_icons'].length * Math.random() | 0]}`

});
