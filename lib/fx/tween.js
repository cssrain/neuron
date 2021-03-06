var 

Fx = require('./core'),
FxCSS = require('./css');


module.exports = NR.Class({

    Extends: Fx,
    
    Implements: FxCSS,

    initialize: function(element, options){
        var self = this;
        
        // @type {Object}
        self.element = self.subject = $(element);
        
        Fx.call(self, options);
    },

    _set: function(now){
        var self = this;
        
        self._render(self.element, self.property, now, self.get('unit'));
        return self;
    },

    start: function(property, from, to){
        var self = this,
            args,
            parsed;
            
        args = NR.makeArray(arguments);
        
        if(!self.property){
            self.property = args.shift();
        }
        
        parsed = this._prepare(self.element, self.property, args);
        
        return Fx.prototype.start.call(self, parsed.from, parsed.to);
    }

});

/**
 change log:
 
 2011-10-26  Kael
 - migrate to Neuron
 - remove chain methods of mootools
 
 2011-10-19  Kael:
 - refractor Fx.Tween, no longer inherit from Fx.CSS
 
 
 
 
 */