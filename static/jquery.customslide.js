// Thanks to "jnn" for this code
// http://stackoverflow.com/a/7266950/154399
$.effects.customSlide = function(o) {

    return this.queue(function() {

        // Create element
        var el = $(this),
            props = ['position', 'top', 'bottom', 'left', 'right'];

        // Set options
        var mode = $.effects.setMode(el, o.options.mode || 'show'); // Set Mode
        var direction = o.options.direction || 'left'; // Default Direction
        // Adjust
        $.effects.save(el, props);
        el.show(); // Save & Show
        $.effects.createWrapper(el).css({
            overflow: 'hidden'
        }); // Create Wrapper
        var ref = (direction == 'up' || direction == 'down') ? 'top' : 'left';
        var motion = (direction == 'up' || direction == 'left') ? 'pos' : 'neg';
        var distance = o.options.distance || (ref == 'top' ? el.outerHeight({
            margin: true
        }) : el.outerWidth({
            margin: true
        }));
        if (mode == 'show') el.parent().css('height', 0);
        
        if (mode == 'show') el.css(ref, motion == 'pos' ? (isNaN(distance) ? "-" + distance : -distance) : distance); // Shift
        // Animation
        var animation = {};
        animation[ref] = (mode == 'show' ? (motion == 'pos' ? '+=' : '-=') : (motion == 'pos' ? '-=' : '+=')) + distance;

        el.parent().animate({
            height: (mode == 'show' ? distance : 0)
        }, {
            queue: false,
            duration: o.duration,
            easing: o.options.easing
        });
        el.animate(animation, {
            queue: false,
            duration: o.duration,
            easing: o.options.easing,
            complete: function() {
                if (mode == 'hide') el.hide(); // Hide
                $.effects.restore(el, props);
                $.effects.removeWrapper(el); // Restore
                if (o.callback) o.callback.apply(this, arguments); // Callback
                el.dequeue();
            }
        });

    });

};