

    $(document).on('mousemove', '#main', function(event) {
      var x = Math.round(event.originalEvent.offsetX / 281 * 100, 2);
      var y = Math.round(event.originalEvent.offsetY / 400 * 100, 2);
      var radius = 10;
      $('#spot').css({
        background: 'radial-gradient(circle at '+x+'% '+y+'%, transparent 0%, transparent '+radius+'%, black '+(radius+1)+'%, black 100%)'
      })
      console.log('x:'+x+' y:'+y);
    });

    
        background: 'radial-gradient(circle at '+x+'px '+y+'px, transparent 0%, transparent 10%, rgba(0,0,0,0.8) 11%, rgba(0,0,0,0.8) 12%, rgba(0,0,0,0.5) 100%)'