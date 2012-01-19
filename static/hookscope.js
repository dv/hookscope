  function label(name) {
    return $("[data-label=" + name + "]");
  }

  function setLabel(name, value) {
    label(name).html(value);
    label(name).filter("a").attr("href", value);
  }

  $(function() {

    if(!window.location.hash) {
      window.location.hash = "#" + createRandomWord(6);     
    }
    
    label("channelname").html(window.location.hash);


    var socket = io.connect();
    
    socket.on('connect', function() {
      setLabel("status", "connected");
      socket.emit("set channel", window.location.hash.slice(1));
    });

    socket.on('disconnect', function() {
      setLabel("status", "disconnected");
    });

    socket.on('history', function(data) {
      for (var i = 0; i < data.length; i++) {
        if (console) { console.log(data[i]); }
        $("#request-tmpl").tmpl(data[i]).appendTo("#requests");
      }

      $(".easydate").easydate();
    });

    socket.on('request', function(data) {
      console.log(data);
      $("#request-tmpl").tmpl(data).hide().prependTo("#requests").show("customSlide", { direction: "up" }, 1000);

      $(".easydate").easydate();
    });

    socket.on('setUrls', function(urls) {
      formatted = [];
      _.each(urls, function(url) {
          if (url[0] == "/") {
            formatted.push("http://" + window.location.host + url);
          } else {
            formatted.push("http://" + url + "/");
          }
      });

      document.webhookUrl = formatted[0];
      setLabel("url", formatted[0]);
    });

    $("#clear").click(function(e) {
      e.preventDefault();
      $("#requests").attr("id", "oldrequests").hide("customSlide", { direction: "up" }, 1000);
      $("<div/>", { id: "requests" }).prependTo("#requests-list");
      
      socket.emit("clear");
    });

    $("#sample").click(function(e) {
      e.preventDefault();
      sampleRequest(document.webhookUrl);
    })
  });

  function sampleRequest(url) {
    $.ajax({
      url: url,
      type: "POST",
      data: {
        "sample-request": true,
        "greeting": "I hope you're having fun playing with Hookscope!",
      }
    });
  }

  // createRandomWord by James Padolsey
  // http://james.padolsey.com/javascript/random-word-generator/
  function createRandomWord(length) {
    var consonants = 'bcdfghjklmnpqrstvwxyz',
        vowels = 'aeiou',
        rand = function(limit) {
            return Math.floor(Math.random()*limit);
        },
        i, word='', length = parseInt(length,10),
        consonants = consonants.split(''),
        vowels = vowels.split('');

    for (i=0;i<length/2;i++) {
        var randConsonant = consonants[rand(consonants.length)],
            randVowel = vowels[rand(vowels.length)];
        word += randConsonant;
        word += i*2<length-1 ? randVowel : '';
    }
    return word;
  }