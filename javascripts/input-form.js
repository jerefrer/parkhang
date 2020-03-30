var layouts = [
  { id: 'a4',           name: 'A4', imageName: 'page-big.png'     },
  { id: 'pecha-a3',     name: 'A3', imageName: 'pecha-big.png'    },
  { id: 'pecha-a4',     name: 'A4', imageName: 'pecha-small.png'  },
  { id: 'page-screen',  name:   '', imageName: 'page-screen.png'  },
  { id: 'pecha-screen', name:   '', imageName: 'pecha-screen.png' }
]

var selectedLanguage;
var languages = [
  { id: 'english', name: '<i class="gb flag"></i> English'},
  { id: 'french',  name: '<i class="france flag"></i> French' }
]

var layoutSelect = function() {
  return '\
    <div class="ui field">\
      <div class="ui centered layouts cards">'+
        _(layouts).map(function(layout) {
          return ('\
            <div class="ui layout link card" data-id="'+layout.id+'">\
              <div class="image">\
                <img src="images/layouts/'+layout.imageName+'"</div>\
                <div class="name">'+layout.name+'</div>\
              </div>\
            </div>\
          ')
        }).join('')+'\
      </div>\
    </div>\
  ';
}

var languageSelect = function() {
  return ('\
    <div class="ui inline languages fields">'+
      _(languages).map(function(language) {
        return ('\
          <div class="field">\
            <div class="ui language radio checkbox">\
              <input type="radio" name="language" value="'+language.id+'">\
              <label>'+language.name+'</label>\
            </div>\
          </div>\
        ')
      }).join('')+'\
    </div>\
  ');
}

var textSelect = function() {
  var texts = localStorage['pechanator.texts'] && JSON.parse(localStorage['pechanator.texts']) || {};
  return '\
    <div class="ui field">\
      <div class="ui centered cards">'+
        _(texts).map(function(name, id) {
          return ('\
            <div class="ui text link card" data-id="'+id+'">\
              <div class="content">\
                <div class="header">'+name+'</div>\
              </div>\
            </div>\
          ')
        }).join('')+'\
      </div>\
    </div>\
  ';
}

var renderInputForm = function() {
  var form = $('<div id="input-form" class="ui form">');
  form.append(layoutSelect);
  if (localStorage['pechanator.texts'].length) form.append('<div class="ui inverted divider" style="margin: 18px auto 30px"></div>');
  form.append(textSelect);
  if (localStorage['pechanator.texts'].length) form.append('<div class="ui horizontal inverted divider">or</div>');
  form.append('\
    <div class="ui file field">\
      <div class="ui input" id="file-input">\
        <input type="file" />\
      </div>\
    </div>\
  ')
  if (localStorage['pechanator.texts'].length) form.append('<div class="ui inverted divider"></div>');
  form.append(languageSelect);
  if (localStorage['pechanator.texts'].length) form.append('<div class="ui inverted divider"></div>');
  form.append('<div class="file field"><button class="ui fluid blue button" id="render-button">Render!</button></div>');
  $('#main').html(form);
  $('#layout').dropdown({showOnFocus: false});
  $('.ui.checkbox').checkbox();
  var textId = localStorage['pechanator.textId'];
  var layout = localStorage['pechanator.layout'];
  var language = localStorage['pechanator.language'];
  if (textId) $('.text[data-id='+textId+']').click();
  if (layout) $('.layout[data-id='+layout+']').click();
  if (language) $('input[name=language][value='+language+']').click();
}

$(document).on('click', '.layout', function(event) {
  $('.layout').removeClass('selected');
  $(event.currentTarget).addClass('selected');
});

$(document).on('change', 'input[type=radio]', function(event) {
  $('.language.radio').removeClass('selected');
  $(event.currentTarget).parents('.language.radio').addClass('selected');
});

$(document).on('change', '#file-input input', function(event) {
  $('.text').removeClass('selected');
});

$(document).on('click', '.text', function(event) {
  $('.text').removeClass('selected');
  $('#file-input input').val('');
  $(event.currentTarget).addClass('selected');
});

$(document).on('click', '#render-button', function() {
  var textId = localStorage['pechanator.textId'] = $('.text.selected').data('id');
  var layout = localStorage['pechanator.layout'] = $('.layout.selected').data('id');
  selectedLanguage = localStorage['pechanator.language'] = $('input[name=language]:checked').val();
  $('body').addClass(layout);
  if (textId) {
    pecha = JSON.parse(localStorage['pechanator.texts.'+textId]);
    beginGeneration()
  } else
    importCSV();
  $('#input-form').remove();
  $('#loading-overlay').show();
})