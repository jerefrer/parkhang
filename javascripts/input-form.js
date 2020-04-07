var layouts = [
  { id: 'pecha-a3',       name:         'A3', imageName: 'pecha-big.png'       },
  { id: 'pecha-a4',       name:         'A4', imageName: 'pecha-small.png'     },
  { id: 'pecha-screen',   name:           '', imageName: 'pecha-screen.png'    },
  { id: 'page-a4',        name:         'A4', imageName: 'page-big.png'        },
  { id: 'page-a5',        name:         'A5', imageName: 'page-small.png'      },
  { id: 'page-screen',    name:           '', imageName: 'page-screen.png'     },
  { id: 'classic-a4',     name: 'Classic A4', imageName: 'page-big.png'        },
  { id: 'classic-a5',     name: 'Classic A5', imageName: 'page-small.png'      },
  { id: 'classic-screen', name:    'Classic', imageName: 'page-screen.png'     },
  { id: 'split-a4',       name:   'Split A4', imageName: 'page-dual-big.png'   },
  { id: 'split-a5',       name:   'Split A5', imageName: 'page-dual-small.png' }
]

var bodyHasClass = function(cssClass) {
  return ($('body').attr('class') || '').match(cssClass);
}
var isAPecha = function() {
  return !!bodyHasClass('pecha');
}
var isAPage = function() {
  return !!bodyHasClass('page');
}
var isPageA4 = function() {
  return !!bodyHasClass('page-a4');
}
var isPageA5 = function() {
  return !!bodyHasClass('page-a5');
}
var isPageScreen = function() {
  return !!bodyHasClass('page-screen');
}
var isAClassicPage = function() {
  return !!bodyHasClass('classic');
}
var isASplitPage = function() {
  return !!bodyHasClass('split');
}

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
            <div class="ui layout link card '+(layout.disabled && 'disabled' || '')+'" data-id="'+layout.id+'">\
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

var extraTexts = JSON.parse(localStorage['pechanator.extra-texts']);
var extraTextsSelect = function() {
  return '\
    <div class="ui field">\
      <div class="ui centered cards">'+
        _(extraTexts).map(function(extraText) {
          return ('\
            <div class="ui extra-text link card" data-id="'+extraText.id+'">\
              <div class="content">\
                <div class="header">Include '+extraText.name+'</div>\
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
  form.append(textSelect);
  if (localStorage['pechanator.texts'].length) form.append('<div class="ui horizontal inverted divider" style="width: 220px; margin-top: 25px">or</div>');
  form.append('\
    <div class="ui file field">\
      <div class="ui input" id="file-input">\
        <input type="file" />\
      </div>\
    </div>\
  ')
  form.append('<div class="ui inverted divider" style="margin-bottom: 25px;"></div>');
  form.append(extraTextsSelect);
  form.append('<div class="ui inverted divider" style="margin-top: 25px;"></div>');
  form.append(languageSelect);
  form.append('<div class="ui inverted divider"></div>');
  form.append(layoutSelect);
  form.append('<div class="ui inverted divider" style="margin: 15px auto 20px"></div>');
  form.append('<div class="file field"><button class="ui fluid green button" id="render-button">Render!</button></div>');
  $('#main').html(form);
  $('#layout').dropdown({showOnFocus: false});
  $('.extra-text.checkbox').checkbox();
  $('.language.checkbox').checkbox();
  var textId = localStorage['pechanator.textId'];
  var layout = localStorage['pechanator.layout'];
  var language = localStorage['pechanator.language'];
  var selectedExtraTexts = localStorage['pechanator.selected-extra-texts'];
  if (textId) $('.text[data-id='+textId+']').click();
  if (layout) $('.layout[data-id='+layout+']').click();
  if (language) $('input[name=language][value='+language+']').click();
  if (selectedExtraTexts && selectedExtraTexts.length) {
    _(JSON.parse(selectedExtraTexts)).each(function(extraTextId) {
      $('.extra-text[data-id='+extraTextId+']').click();
    })
  }
}

$(document).on('click', '.layout:not(.disabled)', function(event) {
  $('.layout').removeClass('selected');
  $(event.currentTarget).addClass('selected');
});

$(document).on('change', 'input[type=radio]', function(event) {
  $('.language.radio').removeClass('selected');
  $(event.currentTarget).parents('.language.radio').addClass('selected');
});

$(document).on('change', '#file-input input', function(event) {
  $('.text').removeClass('selected');
  $(event.currentTarget).parents('.file.field').addClass('selected');
});

$(document).on('click', '.text', function(event) {
  $('.text').removeClass('selected');
  $('#file-input').parents('.file.field').removeClass('selected');
  $('#file-input input').val('');
  $(event.currentTarget).addClass('selected');
});

$(document).on('click', '.extra-text', function(event) {
  $(event.currentTarget).toggleClass('selected');
});

var selectedLanguage;
var selectedExtraTexts;
var includeTransliteration = true;
$(document).on('click', '#render-button', function() {
  var textId = localStorage['pechanator.textId'] = $('.text.selected').data('id');
  var layout = localStorage['pechanator.layout'] = $('.layout.selected').data('id');
  selectedLanguage = localStorage['pechanator.language'] = $('input[name=language]:checked').val();
  selectedExtraTexts = _($('.extra-text.selected')).map(function(text) { return $(text).data('id') });
  localStorage['pechanator.selected-extra-texts'] = JSON.stringify(selectedExtraTexts);
  $('body').addClass(layout);
  if (includeTransliteration) $('body').addClass('with-transliteration');
  if (textId) {
    pecha = JSON.parse(localStorage['pechanator.texts.'+textId]);
    beginGeneration()
  } else
    importCSV();
  $('#input-form').remove();
  $('#loading-overlay').show();
})