$('body').scrollspy({
    target: '.bs-docs-sidebar',
    offset: 40
});
$("#sidebar").affix({
    offset: {
        top: 335        
    }
});


//Navbar Box Shadow on Scroll
$(function() {
    var navbar = $('.navbar');
    $(window).scroll(function() {
        if ($(window).scrollTop() <= 40) {
            navbar.css('box-shadow', 'none');
        } else {
            navbar.css('box-shadow', '0px 10px 20px rgba(0, 0, 0, 0.4)');
        }
    });
});

//Offset scrollspy height to highlight li elements at good window height
$('body').scrollspy({
    offset: 80
});

$('pre').each(function() {
    var lines, offset;

    // split the content of the PRE element into an array of lines
    lines = $(this).text().split('\n');

    // the last line is expected to be an empty line - remove it
    if (lines.length > 1 && lines[lines.length - 1].trim() === '') {
        lines.pop();
    }

    // how much white-space do we need to remove form each line?
    offset = lines[0].match(/^\s*/)[0].length;

    // remove the exess white-space from the beginning of each line
    lines = lines.map(function(line) {
        return line.slice(offset);
    });

    // set this new content to the PRE element
    $(this).text(lines.join('\n'));
});

/*
//Function from Bluthemes, lets you add li elemants to affix object without having to alter and data attributes set out by bootstrap
$(function(){

	// name your elements here
	var stickyElement   = '.panel-affix',   // the element you want to make sticky
		bottomElement   = '#fake-footer'; // the bottom element where you want the sticky element to stop (usually the footer)

	// make sure the element exists on the page before trying to initalize
	if($( stickyElement ).length){
		$( stickyElement ).each(function(){

			// let's save some messy code in clean variables
			// when should we start affixing? (the amount of pixels to the top from the element)
			var fromTop = $( this ).offset().top,
				// where is the bottom of the element?
				fromBottom = $( document ).height()-($( this ).offset().top + $( this ).outerHeight()),
				// where should we stop? (the amount of pixels from the top where the bottom element is)
				// also add the outer height mismatch to the height of the element to account for padding and borders
				stopOn = $( document ).height()-( $( bottomElement ).offset().top)+($( this ).outerHeight() - $( this ).height());

			// if the element doesn't need to get sticky, then skip it so it won't mess up your layout
			if( (fromBottom-stopOn) > 200 ){
				// let's put a sticky width on the element and assign it to the top
				$( this ).css('width', $( this ).width()).css('top', 0).css('position', '');
				// assign the affix to the element
				$( this ).affix({
					offset: {
						// make it stick where the top pixel of the element is
						top: fromTop - 80,
						// make it stop where the top pixel of the bottom element is
						bottom: stopOn
					}
				// when the affix get's called then make sure the position is the default (fixed) and it's at the top
				}).on('affix.bs.affix', function(){ $( this ).css('top', '80px').css('position', ''); });
			}
			// trigger the scroll event so it always activates
			$( window ).trigger('scroll');
		});
	}

});


//Smooth Scrolling For Internal Page Links
$(function() {
  $('a[href*=#]:not([href=#])').click(function() {
	if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
	  var target = $(this.hash);
	  target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
	  if (target.length) {
		$('html,body').animate({
		  scrollTop: target.offset().top
		}, 1000);
		return false;
	  }
	}
  });
});
*/
