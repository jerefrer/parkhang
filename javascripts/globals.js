var appName = 'parkhang';

var tibetanNumber = function(number) {
  if (typeof(number) == 'number') {
    var digits = number.toString().split();
    return _.chain(digits).map(tibetanNumber).join().value();
  } else {
    switch(number) {
      case '0': return '༠'; break;
      case '1': return '༡'; break;
      case '2': return '༢'; break;
      case '3': return '༣'; break;
      case '4': return '༤'; break;
      case '5': return '༥'; break;
      case '6': return '༦'; break;
      case '7': return '༧'; break;
      case '8': return '༨'; break;
      case '9': return '༩'; break;
    }
  }
}