(function(jQuery) {
	var uniqid = 0,
		holding = [],
		timer = [],
		callback = [],
		options = [];

	jQuery.fn.addMouseHold = function (cb, opts) {
		var self = this,
			currentid = uniqid++;
		holding[currentid] = false;
		callback[currentid] = cb || function () {};
		options[currentid] = jQuery.extend({
			bindObject: null,
			duration: 500
		}, opts);

		self.data('set-timer', function () {
			setTimer(currentid);
		});
		self.data('clear-timer', function () {
			clearTimer(currentid);
		});

		return this.each(function () {
			jQuery(this).on('mousedown', self.data('set-timer')).
				on('mouseup', self.data('clear-timer')).
				on('mouseout', self.data('clear-timer'));
		});
	};

	jQuery.fn.removeMouseHold = function () {
		var self = this;
		return this.each(function () {
			jQuery(this).off('mousedown', self.data('set-timer')).
				off('mouseup', self.data('clear-timer')).
				off('mouseout', self.data('clear-timer'));
		});
	};

	function setTimer(currentid) {
		if (!holding[currentid]) {
			holding[currentid] = true;
			timer[currentid] = window.setTimeout(function () {
				if (holding[currentid]) {
					holding[currentid] = false;
					window.clearTimeout(timer[currentid]);
					callback[currentid].call(options[currentid].bindObject);
				}
			}, options[currentid].duration);
		}
	}

	function clearTimer(currentid) {
		if (holding[currentid]) {
			holding[currentid] = false;
			window.clearTimeout(timer[currentid]);
		}
	}
})(jQuery);