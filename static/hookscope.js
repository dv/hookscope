function label(name) {
  return $("[data-label=" + name + "]");
}

function setLabel(name, value) {
  label(name).html(value);
  label(name).filter("a").attr("href", value);
}

function createRequestView(request) {
  var el = $($("#request-template").data("compiled")(request));
  var tbody = el.find(".headers-table");

  el.find(".show-more-headers").click(function() {
    var minHeight = tbody.data("minSliderHeight");
    var maxHeight = tbody.data("maxSliderHeight");
    var curHeight = tbody.height();

    if(curHeight == minHeight){
      tbody.animate({
        height: maxHeight
      }, 500);

    } else {
      tbody.animate({
        height: minHeight
      }, "normal");
      
    }
    
    el.find(".show-more-headers-label").toggle();
  });

  return el;
}

function calculateSliderHeights(el) {
  var minHeight = 0;
  var maxHeight = 0;

  el.find(".popular-header").each(function(index, tr) {
    minHeight += $(tr).height();
  });

  maxHeight = minHeight;

  el.find(".extra-header").each(function(index, tr) {
    maxHeight += $(tr).height();
  });

  // If first time, resize to minimum
  if (el.data("minSliderHeight")) {
    el.css("height", minHeight);
  } else {
    // Not first time so resize
    if (el.height() == el.data("maxSliderHeight")) {
      el.css("height", maxHeight);
    } else {
      el.css("height", minHeight);
    }
  }

  el.data("minSliderHeight", minHeight);
  el.data("maxSliderHeight", maxHeight);
}

$(window).resize(function() {
  $(".headers-table").each(function(index, el) {
    calculateSliderHeights($(el));
  });
});

// Add dropdown functionality
$(function() {
  $('#topbar').dropdown();
});

// Compile all the templates
$(function() {
  $("[type='text/template']").each(function(index, element) {
    $(element).data("compiled", _.template(element.text));
  });
});


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

      var el = createRequestView(data[i]).appendTo("#requests");
      calculateSliderHeights(el.find(".headers-table"));
    }

    $(".easydate").easydate();
  });

  socket.on('request', function(data) {
    console.log(data);
    var el = createRequestView(data).prependTo("#requests");
    calculateSliderHeights(el.find(".headers-table"));

    el.show("customSlide", { direction: "up" }, 1000);
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
      "non-trivial-json": '{"datetime": "' + new Date() + '", "elements": ["car", "house", "casino"]}',
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