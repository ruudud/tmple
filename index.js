var blockregex = /\{\{(([@!]?)(.+?))\}\}(([\s\S]+?)(\{\{:\1\}\}([\s\S]+?))?)\{\{\/\1\}\}/g;
var valregex = /\{\{([=%])(.+?)\}\}/g;

function scrub(val) {
  return new Option(val).innerHTML
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#x27;")
    .replace(/\\/g,"&#x2F;")
    .replace(/`/g,"&#x60;");
}

function get_value(vars, key) {
  var parts = key.split('.');
  while (parts.length) {
    if (!(parts[0] in vars)) {
      return false;
    }
    vars = vars[parts.shift()];
  }
  return vars;
}

function render(fragment, vars) {
  return fragment
    .replace(blockregex, function(_, __, meta, key, inner, if_true, has_else, if_false) {

      var val = get_value(vars,key), temp = "", i;

      if (!val) {

        // handle if not
        if (meta == '!') {
          return render(inner, vars);
        }
        // check for else
        if (has_else) {
          return render(if_false, vars);
        }
        return "";
      }

      // regular if
      if (!meta) {
        return render(if_true, vars);
      }

      // process array/obj iteration
      if (meta == '@') {
        // store any previous vars
        // reuse existing vars
        _ = vars._key;
        __ = vars._val;
        for (i in val) {
          if (val.hasOwnProperty(i)) {
            vars._key = i;
            vars._val = val[i];
            temp += render(inner, vars);
          }
        }
        vars._key = _;
        vars._val = __;
        return temp;
      }

    })
    .replace(valregex, function(_, meta, key) {
      var val = get_value(vars,key);

      if (val || val === 0) {
        return meta == '%' ? scrub(val) : val;
      }
      return "";
    });
}

function tmpl(template) {
  this.t = template;
}
tmpl.prototype.render = function (vars) {
  return render(this.t, vars);
};

module.exports = tmpl;
