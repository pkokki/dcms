angular.module('atlas.sdk', [
	])

    .config([function () {

    }])

    .service('atlasGlobalConfig', [function() {
		var keys = {
			credentials: null,
			credentialProvider: null,
			region: undefined,
			logger: null,
			apiVersions: {},
			apiVersion: null,
			endpoint: undefined,
			httpOptions: {
			  timeout: 120000
			},
			maxRetries: undefined,
			maxRedirects: 10,
			paramValidation: true,
			/* whether SSL is enabled for requests */
			sslEnabled: true,
			computeChecksums: true,
			/** [Number] an offset value in milliseconds to apply to all signing
             *  times. Use this to compensate for clock skew when your system may be
             *  out of sync with the service time. Note that this configuration option
             *  can only be applied to the global `atlasGlobalConfig` object and cannot be
             *  overridden in service-specific configuration. Defaults to 0 milliseconds.
             */
			systemClockOffset: 0,
			signatureVersion: null,
			//convertResponseTypes: true,
			//dynamoDbCrc32: true,
			//s3ForcePathStyle: false,
			//s3BucketEndpoint: false,
		};
        return keys;
    }])

	.service('atlasQuerystring', [function() {
		// https://github.com/joyent/node/blob/master/lib/querystring.js
		var util = {
			isObject: function(arg) { return typeof arg === 'object' && arg !== null; },
			isString: function(arg) { return typeof arg === 'string'; },
			isNullOrUndefined: function(arg) { return arg == null; },
			isNull: function(arg) { return arg === null; },
			isBoolean: function(arg) { return typeof arg === 'boolean'; },
			isNumber: function(arg) { typeof arg === 'number'; },
			isArray: function(arg) { return angular.isArray(arg); },
		};

		var QueryString = {};

		function charCode(c) {
			return c.charCodeAt(0);
		}

		// a safe fast alternative to decodeURIComponent
		QueryString.unescapeBuffer = function(s, decodeSpaces) {
		  var out = new Buffer(s.length);
		  var state = 'CHAR'; // states: CHAR, HEX0, HEX1
		  var n, m, hexchar;

		  for (var inIndex = 0, outIndex = 0; inIndex <= s.length; inIndex++) {
		    var c = s.charCodeAt(inIndex);
		    switch (state) {
		      case 'CHAR':
		        switch (c) {
		          case charCode('%'):
		            n = 0;
		            m = 0;
		            state = 'HEX0';
		            break;
		          case charCode('+'):
		            if (decodeSpaces) c = charCode(' ');
		            // pass thru
		          default:
		            out[outIndex++] = c;
		            break;
		        }
		        break;

		      case 'HEX0':
		        state = 'HEX1';
		        hexchar = c;
		        if (charCode('0') <= c && c <= charCode('9')) {
		          n = c - charCode('0');
		        } else if (charCode('a') <= c && c <= charCode('f')) {
		          n = c - charCode('a') + 10;
		        } else if (charCode('A') <= c && c <= charCode('F')) {
		          n = c - charCode('A') + 10;
		        } else {
		          out[outIndex++] = charCode('%');
		          out[outIndex++] = c;
		          state = 'CHAR';
		          break;
		        }
		        break;

		      case 'HEX1':
		        state = 'CHAR';
		        if (charCode('0') <= c && c <= charCode('9')) {
		          m = c - charCode('0');
		        } else if (charCode('a') <= c && c <= charCode('f')) {
		          m = c - charCode('a') + 10;
		        } else if (charCode('A') <= c && c <= charCode('F')) {
		          m = c - charCode('A') + 10;
		        } else {
		          out[outIndex++] = charCode('%');
		          out[outIndex++] = hexchar;
		          out[outIndex++] = c;
		          break;
		        }
		        out[outIndex++] = 16 * n + m;
		        break;
		    }
		  }

		  // TODO support returning arbitrary buffers.

		  return out.slice(0, outIndex - 1);
		};

		QueryString.unescape = function(s, decodeSpaces) {
		  try {
		    return decodeURIComponent(s);
		  } catch (e) {
		    return QueryString.unescapeBuffer(s, decodeSpaces).toString();
		  }
		};

		QueryString.escape = function(str) {
		  return encodeURIComponent(str);
		};

		var stringifyPrimitive = function(v) {
		  if (util.isString(v))
		    return v;
		  if (util.isBoolean(v))
		    return v ? 'true' : 'false';
		  if (util.isNumber(v))
		    return isFinite(v) ? v : '';
		  return '';
		};

		QueryString.stringify = QueryString.encode = function(obj, sep, eq, options) {
		  sep = sep || '&';
		  eq = eq || '=';

		  var encode = QueryString.escape;
		  if (options && typeof options.encodeURIComponent === 'function') {
		    encode = options.encodeURIComponent;
		  }

		  if (util.isObject(obj)) {
		    var keys = Object.keys(obj);
		    var fields = [];

		    for (var i = 0; i < keys.length; i++) {
		      var k = keys[i];
		      var v = obj[k];
		      var ks = encode(stringifyPrimitive(k)) + eq;

		      if (util.isArray(v)) {
		        for (var j = 0; j < v.length; j++)
		          fields.push(ks + encode(stringifyPrimitive(v[j])));
		      } else {
		        fields.push(ks + encode(stringifyPrimitive(v)));
		      }
		    }
		    return fields.join(sep);
		  }
		  return '';
		};

		// Parse a key=val string.
		QueryString.parse = QueryString.decode = function(qs, sep, eq, options) {
		  sep = sep || '&';
		  eq = eq || '=';
		  var obj = {};

		  if (!util.isString(qs) || qs.length === 0) {
		    return obj;
		  }

		  var regexp = /\+/g;
		  qs = qs.split(sep);

		  var maxKeys = 1000;
		  if (options && util.isNumber(options.maxKeys)) {
		    maxKeys = options.maxKeys;
		  }

		  var len = qs.length;
		  // maxKeys <= 0 means that we should not limit keys count
		  if (maxKeys > 0 && len > maxKeys) {
		    len = maxKeys;
		  }

		  var decode = QueryString.unescape;
		  if (options && typeof options.decodeURIComponent === 'function') {
		    decode = options.decodeURIComponent;
		  }

		  for (var i = 0; i < len; ++i) {
		    var x = qs[i].replace(regexp, '%20'),
		        idx = x.indexOf(eq),
		        kstr, vstr, k, v;

		    if (idx >= 0) {
		      kstr = x.substr(0, idx);
		      vstr = x.substr(idx + 1);
		    } else {
		      kstr = x;
		      vstr = '';
		    }

		    try {
		      k = decode(kstr);
		      v = decode(vstr);
		    } catch (e) {
		      k = QueryString.unescape(kstr, true);
		      v = QueryString.unescape(vstr, true);
		    }

		    if (!hasOwnProperty(obj, k)) {
		      obj[k] = v;
		    } else if (util.isArray(obj[k])) {
		      obj[k].push(v);
		    } else {
		      obj[k] = [obj[k], v];
		    }
		  }

		  return obj;
		};

		return QueryString;
	}])

	.service('atlasUrl', ['atlasQuerystring', function(atlasQuerystring) {
		// https://github.com/joyent/node/blob/master/lib/url.js
		var util = {
			isObject: function(arg) { return typeof arg === 'object' && arg !== null; },
			isString: function(arg) { return typeof arg === 'string'; },
			isNullOrUndefined: function(arg) { return arg == null; },
			isNull: function(arg) { return arg === null; },
		};

		function Url() {
			this.protocol = null;
			this.slashes = null;
			this.auth = null;
			this.host = null;
			this.port = null;
			this.hostname = null;
			this.hash = null;
			this.search = null;
			this.query = null;
			this.pathname = null;
			this.path = null;
			this.href = null;
		}

		// Reference: RFC 3986, RFC 1808, RFC 2396

		// define these here so at least they only have to be
		// compiled once on the first module load.
		var protocolPattern = /^([a-z0-9.+-]+:)/i,
		    portPattern = /:[0-9]*$/,

		    // Special case for a simple path URL
		    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

		    // RFC 2396: characters reserved for delimiting URLs.
		    // We actually just auto-escape these.
		    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

		    // RFC 2396: characters not allowed for various reasons.
		    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

		    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
		    autoEscape = ['\''].concat(unwise),
		    // Characters that are never ever allowed in a hostname.
		    // Note that any invalid chars are also handled, but these
		    // are the ones that are *expected* to be seen, so we fast-path
		    // them.
		    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
		    hostEndingChars = ['/', '?', '#'],
		    hostnameMaxLen = 255,
		    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
		    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
		    // protocols that can allow "unsafe" and "unwise" chars.
		    unsafeProtocol = {
		      'javascript': true,
		      'javascript:': true
		    },
		    // protocols that never have a hostname.
		    hostlessProtocol = {
		      'javascript': true,
		      'javascript:': true
		    },
		    // protocols that always contain a // bit.
		    slashedProtocol = {
		      'http': true,
		      'https': true,
		      'ftp': true,
		      'gopher': true,
		      'file': true,
		      'http:': true,
		      'https:': true,
		      'ftp:': true,
		      'gopher:': true,
		      'file:': true
		    },
		    querystring = atlasQuerystring;

		function urlParse(url, parseQueryString, slashesDenoteHost) {
			if (url && util.isObject(url) && url instanceof Url) return url;

			var u = new Url;
			u.parse(url, parseQueryString, slashesDenoteHost);
			return u;
		}

		Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
		  if (!util.isString(url)) {
		    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
		  }

		  // Copy chrome, IE, opera backslash-handling behavior.
		  // Back slashes before the query string get converted to forward slashes
		  // See: https://code.google.com/p/chromium/issues/detail?id=25916
		  var queryIndex = url.indexOf('?'),
		      splitter =
		          (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
		      uSplit = url.split(splitter),
		      slashRegex = /\\/g;
		  uSplit[0] = uSplit[0].replace(slashRegex, '/');
		  url = uSplit.join(splitter);
		  var rest = url;

		  // trim before proceeding.
		  // This is to support parse stuff like "  http://foo.com  \n"
		  rest = rest.trim();

		  if (!slashesDenoteHost && url.split('#').length === 1) {
		    // Try fast path regexp
		    var simplePath = simplePathPattern.exec(rest);
		    if (simplePath) {
		      this.path = rest;
		      this.href = rest;
		      this.pathname = simplePath[1];
		      if (simplePath[2]) {
		        this.search = simplePath[2];
		        if (parseQueryString) {
		          this.query = querystring.parse(this.search.substr(1));
		        } else {
		          this.query = this.search.substr(1);
		        }
		      } else if (parseQueryString) {
		        this.search = '';
		        this.query = {};
		      }
		      return this;
		    }
		  }

		  var proto = protocolPattern.exec(rest);
		  if (proto) {
		    proto = proto[0];
		    var lowerProto = proto.toLowerCase();
		    this.protocol = lowerProto;
		    rest = rest.substr(proto.length);
		  }

		  // figure out if it's got a host
		  // user@server is *always* interpreted as a hostname, and url
		  // resolution will treat //foo/bar as host=foo,path=bar because that's
		  // how the browser resolves relative URLs.
		  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
		    var slashes = rest.substr(0, 2) === '//';
		    if (slashes && !(proto && hostlessProtocol[proto])) {
		      rest = rest.substr(2);
		      this.slashes = true;
		    }
		  }

		  if (!hostlessProtocol[proto] &&
		      (slashes || (proto && !slashedProtocol[proto]))) {

		    // there's a hostname.
		    // the first instance of /, ?, ;, or # ends the host.
		    //
		    // If there is an @ in the hostname, then non-host chars *are* allowed
		    // to the left of the last @ sign, unless some host-ending character
		    // comes *before* the @-sign.
		    // URLs are obnoxious.
		    //
		    // ex:
		    // http://a@b@c/ => user:a@b host:c
		    // http://a@b?@c => user:a host:c path:/?@c

		    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
		    // Review our test case against browsers more comprehensively.

		    // find the first instance of any hostEndingChars
		    var hostEnd = -1;
		    for (var i = 0; i < hostEndingChars.length; i++) {
		      var hec = rest.indexOf(hostEndingChars[i]);
		      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
		        hostEnd = hec;
		    }

		    // at this point, either we have an explicit point where the
		    // auth portion cannot go past, or the last @ char is the decider.
		    var auth, atSign;
		    if (hostEnd === -1) {
		      // atSign can be anywhere.
		      atSign = rest.lastIndexOf('@');
		    } else {
		      // atSign must be in auth portion.
		      // http://a@b/c@d => host:b auth:a path:/c@d
		      atSign = rest.lastIndexOf('@', hostEnd);
		    }

		    // Now we have a portion which is definitely the auth.
		    // Pull that off.
		    if (atSign !== -1) {
		      auth = rest.slice(0, atSign);
		      rest = rest.slice(atSign + 1);
		      this.auth = decodeURIComponent(auth);
		    }

		    // the host is the remaining to the left of the first non-host char
		    hostEnd = -1;
		    for (var i = 0; i < nonHostChars.length; i++) {
		      var hec = rest.indexOf(nonHostChars[i]);
		      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
		        hostEnd = hec;
		    }
		    // if we still have not hit it, then the entire thing is a host.
		    if (hostEnd === -1)
		      hostEnd = rest.length;

		    this.host = rest.slice(0, hostEnd);
		    rest = rest.slice(hostEnd);

		    // pull out port.
		    this.parseHost();

		    // we've indicated that there is a hostname,
		    // so even if it's empty, it has to be present.
		    this.hostname = this.hostname || '';

		    // if hostname begins with [ and ends with ]
		    // assume that it's an IPv6 address.
		    var ipv6Hostname = this.hostname[0] === '[' &&
		        this.hostname[this.hostname.length - 1] === ']';

		    // validate a little.
		    if (!ipv6Hostname) {
		      var hostparts = this.hostname.split(/\./);
		      for (var i = 0, l = hostparts.length; i < l; i++) {
		        var part = hostparts[i];
		        if (!part) continue;
		        if (!part.match(hostnamePartPattern)) {
		          var newpart = '';
		          for (var j = 0, k = part.length; j < k; j++) {
		            if (part.charCodeAt(j) > 127) {
		              // we replace non-ASCII char with a temporary placeholder
		              // we need this to make sure size of hostname is not
		              // broken by replacing non-ASCII by nothing
		              newpart += 'x';
		            } else {
		              newpart += part[j];
		            }
		          }
		          // we test again with ASCII char only
		          if (!newpart.match(hostnamePartPattern)) {
		            var validParts = hostparts.slice(0, i);
		            var notHost = hostparts.slice(i + 1);
		            var bit = part.match(hostnamePartStart);
		            if (bit) {
		              validParts.push(bit[1]);
		              notHost.unshift(bit[2]);
		            }
		            if (notHost.length) {
		              rest = '/' + notHost.join('.') + rest;
		            }
		            this.hostname = validParts.join('.');
		            break;
		          }
		        }
		      }
		    }

		    if (this.hostname.length > hostnameMaxLen) {
		      this.hostname = '';
		    } else {
		      // hostnames are always lower case.
		      this.hostname = this.hostname.toLowerCase();
		    }

		    if (!ipv6Hostname) {
		      // IDNA Support: Returns a punycoded representation of "domain".
		      // It only converts parts of the domain name that
		      // have non-ASCII characters, i.e. it doesn't matter if
		      // you call it with a domain that already is ASCII-only.
		      //this.hostname = punycode.toASCII(this.hostname);
		    }

		    var p = this.port ? ':' + this.port : '';
		    var h = this.hostname || '';
		    this.host = h + p;
		    this.href += this.host;

		    // strip [ and ] from the hostname
		    // the host field still retains them, though
		    if (ipv6Hostname) {
		      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
		      if (rest[0] !== '/') {
		        rest = '/' + rest;
		      }
		    }
		  }

		  // now rest is set to the post-host stuff.
		  // chop off any delim chars.
		  if (!unsafeProtocol[lowerProto]) {

		    // First, make 100% sure that any "autoEscape" chars get
		    // escaped, even if encodeURIComponent doesn't think they
		    // need to be.
		    for (var i = 0, l = autoEscape.length; i < l; i++) {
		      var ae = autoEscape[i];
		      if (rest.indexOf(ae) === -1)
		        continue;
		      var esc = encodeURIComponent(ae);
		      if (esc === ae) {
		        esc = escape(ae);
		      }
		      rest = rest.split(ae).join(esc);
		    }
		  }


		  // chop off from the tail first.
		  var hash = rest.indexOf('#');
		  if (hash !== -1) {
		    // got a fragment string.
		    this.hash = rest.substr(hash);
		    rest = rest.slice(0, hash);
		  }
		  var qm = rest.indexOf('?');
		  if (qm !== -1) {
		    this.search = rest.substr(qm);
		    this.query = rest.substr(qm + 1);
		    if (parseQueryString) {
		      this.query = querystring.parse(this.query);
		    }
		    rest = rest.slice(0, qm);
		  } else if (parseQueryString) {
		    // no query string, but parseQueryString still requested
		    this.search = '';
		    this.query = {};
		  }
		  if (rest) this.pathname = rest;
		  if (slashedProtocol[lowerProto] &&
		      this.hostname && !this.pathname) {
		    this.pathname = '/';
		  }

		  //to support http.request
		  if (this.pathname || this.search) {
		    var p = this.pathname || '';
		    var s = this.search || '';
		    this.path = p + s;
		  }

		  // finally, reconstruct the href based on what has been validated.
		  this.href = this.format();
		  return this;
		};

		// format a parsed object into a url string
		function urlFormat(obj) {
		  // ensure it's an object, and not a string url.
		  // If it's an obj, this is a no-op.
		  // this way, you can call url_format() on strings
		  // to clean up potentially wonky urls.
		  if (util.isString(obj)) obj = urlParse(obj);
		  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
		  return obj.format();
		}

		Url.prototype.format = function() {
		  var auth = this.auth || '';
		  if (auth) {
		    auth = encodeURIComponent(auth);
		    auth = auth.replace(/%3A/i, ':');
		    auth += '@';
		  }

		  var protocol = this.protocol || '',
		      pathname = this.pathname || '',
		      hash = this.hash || '',
		      host = false,
		      query = '';

		  if (this.host) {
		    host = auth + this.host;
		  } else if (this.hostname) {
		    host = auth + (this.hostname.indexOf(':') === -1 ?
		        this.hostname :
		        '[' + this.hostname + ']');
		    if (this.port) {
		      host += ':' + this.port;
		    }
		  }

		  if (this.query &&
		      util.isObject(this.query) &&
		      Object.keys(this.query).length) {
		    query = querystring.stringify(this.query);
		  }

		  var search = this.search || (query && ('?' + query)) || '';

		  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

		  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
		  // unless they had them to begin with.
		  if (this.slashes ||
		      (!protocol || slashedProtocol[protocol]) && host !== false) {
		    host = '//' + (host || '');
		    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
		  } else if (!host) {
		    host = '';
		  }

		  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
		  if (search && search.charAt(0) !== '?') search = '?' + search;

		  pathname = pathname.replace(/[?#]/g, function(match) {
		    return encodeURIComponent(match);
		  });
		  search = search.replace('#', '%23');

		  return protocol + host + pathname + search + hash;
		};

		function urlResolve(source, relative) {
		  return urlParse(source, false, true).resolve(relative);
		}

		Url.prototype.resolve = function(relative) {
		  return this.resolveObject(urlParse(relative, false, true)).format();
		};

		function urlResolveObject(source, relative) {
		  if (!source) return relative;
		  return urlParse(source, false, true).resolveObject(relative);
		}

		Url.prototype.resolveObject = function(relative) {
		  if (util.isString(relative)) {
		    var rel = new Url();
		    rel.parse(relative, false, true);
		    relative = rel;
		  }
		  var result = new Url();
		  var tkeys = Object.keys(this);
		  for (var tk = 0; tk < tkeys.length; tk++) {
		    var tkey = tkeys[tk];
		    result[tkey] = this[tkey];
		  }

		  // hash is always overridden, no matter what.
		  // even href="" will remove it.
		  result.hash = relative.hash;

		  // if the relative url is empty, then there's nothing left to do here.
		  if (relative.href === '') {
		    result.href = result.format();
		    return result;
		  }

		  // hrefs like //foo/bar always cut to the protocol.
		  if (relative.slashes && !relative.protocol) {
		    // take everything except the protocol from relative
		    var rkeys = Object.keys(relative);
		    for (var rk = 0; rk < rkeys.length; rk++) {
		      var rkey = rkeys[rk];
		      if (rkey !== 'protocol')
		        result[rkey] = relative[rkey];
		    }

		    //urlParse appends trailing / to urls like http://www.example.com
		    if (slashedProtocol[result.protocol] &&
		        result.hostname && !result.pathname) {
		      result.path = result.pathname = '/';
		    }

		    result.href = result.format();
		    return result;
		  }

		  if (relative.protocol && relative.protocol !== result.protocol) {
		    // if it's a known url protocol, then changing
		    // the protocol does weird things
		    // first, if it's not file:, then we MUST have a host,
		    // and if there was a path
		    // to begin with, then we MUST have a path.
		    // if it is file:, then the host is dropped,
		    // because that's known to be hostless.
		    // anything else is assumed to be absolute.
		    if (!slashedProtocol[relative.protocol]) {
		      var keys = Object.keys(relative);
		      for (var v = 0; v < keys.length; v++) {
		        var k = keys[v];
		        result[k] = relative[k];
		      }
		      result.href = result.format();
		      return result;
		    }

		    result.protocol = relative.protocol;
		    if (!relative.host && !hostlessProtocol[relative.protocol]) {
		      var relPath = (relative.pathname || '').split('/');
		      while (relPath.length && !(relative.host = relPath.shift()));
		      if (!relative.host) relative.host = '';
		      if (!relative.hostname) relative.hostname = '';
		      if (relPath[0] !== '') relPath.unshift('');
		      if (relPath.length < 2) relPath.unshift('');
		      result.pathname = relPath.join('/');
		    } else {
		      result.pathname = relative.pathname;
		    }
		    result.search = relative.search;
		    result.query = relative.query;
		    result.host = relative.host || '';
		    result.auth = relative.auth;
		    result.hostname = relative.hostname || relative.host;
		    result.port = relative.port;
		    // to support http.request
		    if (result.pathname || result.search) {
		      var p = result.pathname || '';
		      var s = result.search || '';
		      result.path = p + s;
		    }
		    result.slashes = result.slashes || relative.slashes;
		    result.href = result.format();
		    return result;
		  }

		  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
		      isRelAbs = (
		          relative.host ||
		          relative.pathname && relative.pathname.charAt(0) === '/'
		      ),
		      mustEndAbs = (isRelAbs || isSourceAbs ||
		                    (result.host && relative.pathname)),
		      removeAllDots = mustEndAbs,
		      srcPath = result.pathname && result.pathname.split('/') || [],
		      relPath = relative.pathname && relative.pathname.split('/') || [],
		      psychotic = result.protocol && !slashedProtocol[result.protocol];

		  // if the url is a non-slashed url, then relative
		  // links like ../.. should be able
		  // to crawl up to the hostname, as well.  This is strange.
		  // result.protocol has already been set by now.
		  // Later on, put the first path part into the host field.
		  if (psychotic) {
		    result.hostname = '';
		    result.port = null;
		    if (result.host) {
		      if (srcPath[0] === '') srcPath[0] = result.host;
		      else srcPath.unshift(result.host);
		    }
		    result.host = '';
		    if (relative.protocol) {
		      relative.hostname = null;
		      relative.port = null;
		      if (relative.host) {
		        if (relPath[0] === '') relPath[0] = relative.host;
		        else relPath.unshift(relative.host);
		      }
		      relative.host = null;
		    }
		    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
		  }

		  if (isRelAbs) {
		    // it's absolute.
		    result.host = (relative.host || relative.host === '') ?
		                  relative.host : result.host;
		    result.hostname = (relative.hostname || relative.hostname === '') ?
		                      relative.hostname : result.hostname;
		    result.search = relative.search;
		    result.query = relative.query;
		    srcPath = relPath;
		    // fall through to the dot-handling below.
		  } else if (relPath.length) {
		    // it's relative
		    // throw away the existing file, and take the new path instead.
		    if (!srcPath) srcPath = [];
		    srcPath.pop();
		    srcPath = srcPath.concat(relPath);
		    result.search = relative.search;
		    result.query = relative.query;
		  } else if (!util.isNullOrUndefined(relative.search)) {
		    // just pull out the search.
		    // like href='?foo'.
		    // Put this after the other two cases because it simplifies the booleans
		    if (psychotic) {
		      result.hostname = result.host = srcPath.shift();
		      //occationaly the auth can get stuck only in host
		      //this especialy happens in cases like
		      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
		      var authInHost = result.host && result.host.indexOf('@') > 0 ?
		                       result.host.split('@') : false;
		      if (authInHost) {
		        result.auth = authInHost.shift();
		        result.host = result.hostname = authInHost.shift();
		      }
		    }
		    result.search = relative.search;
		    result.query = relative.query;
		    //to support http.request
		    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
		      result.path = (result.pathname ? result.pathname : '') +
		                    (result.search ? result.search : '');
		    }
		    result.href = result.format();
		    return result;
		  }

		  if (!srcPath.length) {
		    // no path at all.  easy.
		    // we've already handled the other stuff above.
		    result.pathname = null;
		    //to support http.request
		    if (result.search) {
		      result.path = '/' + result.search;
		    } else {
		      result.path = null;
		    }
		    result.href = result.format();
		    return result;
		  }

		  // if a url ENDs in . or .., then it must get a trailing slash.
		  // however, if it ends in anything else non-slashy,
		  // then it must NOT get a trailing slash.
		  var last = srcPath.slice(-1)[0];
		  var hasTrailingSlash = (
		      (result.host || relative.host || srcPath.length > 1) &&
		      (last === '.' || last === '..') || last === '');

		  // strip single dots, resolve double dots to parent dir
		  // if the path tries to go above the root, `up` ends up > 0
		  var up = 0;
		  for (var i = srcPath.length; i >= 0; i--) {
		    last = srcPath[i];
		    if (last === '.') {
		      srcPath.splice(i, 1);
		    } else if (last === '..') {
		      srcPath.splice(i, 1);
		      up++;
		    } else if (up) {
		      srcPath.splice(i, 1);
		      up--;
		    }
		  }

		  // if the path is allowed to go above the root, restore leading ..s
		  if (!mustEndAbs && !removeAllDots) {
		    for (; up--; up) {
		      srcPath.unshift('..');
		    }
		  }

		  if (mustEndAbs && srcPath[0] !== '' &&
		      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
		    srcPath.unshift('');
		  }

		  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
		    srcPath.push('');
		  }

		  var isAbsolute = srcPath[0] === '' ||
		      (srcPath[0] && srcPath[0].charAt(0) === '/');

		  // put the host back
		  if (psychotic) {
		    result.hostname = result.host = isAbsolute ? '' :
		                                    srcPath.length ? srcPath.shift() : '';
		    //occationaly the auth can get stuck only in host
		    //this especialy happens in cases like
		    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
		    var authInHost = result.host && result.host.indexOf('@') > 0 ?
		                     result.host.split('@') : false;
		    if (authInHost) {
		      result.auth = authInHost.shift();
		      result.host = result.hostname = authInHost.shift();
		    }
		  }

		  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

		  if (mustEndAbs && !isAbsolute) {
		    srcPath.unshift('');
		  }

		  if (!srcPath.length) {
		    result.pathname = null;
		    result.path = null;
		  } else {
		    result.pathname = srcPath.join('/');
		  }

		  //to support request.http
		  if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
		    result.path = (result.pathname ? result.pathname : '') +
		                  (result.search ? result.search : '');
		  }
		  result.auth = relative.auth || result.auth;
		  result.slashes = result.slashes || relative.slashes;
		  result.href = result.format();
		  return result;
		};

		Url.prototype.parseHost = function() {
		  var host = this.host;
		  var port = portPattern.exec(host);
		  if (port) {
		    port = port[0];
		    if (port !== ':') {
		      this.port = port.substr(1);
		    }
		    host = host.substr(0, host.length - port.length);
		  }
		  if (host) this.hostname = host;
		};

		return {
			parse: urlParse,
			resolve: urlResolve,
			resolveObject: urlResolveObject,
			format: urlFormat,
			Url: Url
		}
	}])

    .service('atlasUtil', ['atlasGlobalConfig', 'atlasUrl', function(atlasGlobalConfig, atlasUrl) {
        /* Date and time utility functions. */
        var dateUtil = {
            /**
             * @return [Date] the current JavaScript date object.
             */
            getDate: function() {
                if (atlasGlobalConfig.systemClockOffset) {
                    return new Date(new Date().getTime() + atlasGlobalConfig.systemClockOffset);
                }
                else {
                    return new Date();
                }
            },
            /**
             * @return [String] the date in ISO-8601 format
             */
            iso8601: function iso8601(date) {
                if (date === undefined) {
                    date = dateUtil.getDate();
                }
                return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
            },
            /**
             * @return [String] the date in ISO-8601 format
             */
            rfc822: function rfc822(date) {
                 if (date === undefined) {
                     date = dateUtil.getDate();
                 }
                 return date.toUTCString();
             },
        };
        var util = {
            date: dateUtil,
            inherit: inherit,
            isEmpty: function isEmpty(obj) {
                for (var prop in obj) {
                    if (obj.hasOwnProperty(prop)) {
                        return false;
                    }
                }
                return true;
            },
            /* Abort constant */
            abort: {},
            each: function each(object, iterFunction) {
                for (var key in object) {
                    if (object.hasOwnProperty(key)) {
                        var ret = iterFunction.call(this, key, object[key]);
                        if (ret === util.abort) break;
                    }
                }
            },
			error: function error(err, options) {
				var originalError = null;
				if (typeof err.message === 'string' && err.message !== '') {
					if (typeof options === 'string' || (options && options.message)) {
						originalError = angular.extend({}, err);
						originalError.message = err.message;
					}
				}
				err.message = err.message || null;
				if (typeof options === 'string') {
					err.message = options;
				} else {
					angular.extend(err, options);
				}

				if (typeof Object.defineProperty === 'function') {
					Object.defineProperty(err, 'name', {writable: true, enumerable: false});
					Object.defineProperty(err, 'message', {enumerable: true});
				}

				err.name = err.name || err.code || 'Error';
				err.time = new Date();

				if (originalError) err.originalError = originalError;

				return err;
			},
			urlParse: function urlParse(url) {
    			return atlasUrl.parse(url);
  			}
        }
        return util;


        function inherit(klass, features) {
            var newObject = null;
            if (features === undefined) {
                features = klass;
                klass = Object;
                newObject = {};
            }
            else {
                var ctor = function ConstructorWrapper() {};
                ctor.prototype = klass.prototype;
                newObject = new ctor();
            }
            // constructor not supplied, create pass-through ctor
            if (features.constructor === Object) {
                features.constructor = function() {
                    if (klass !== Object) {
                        return klass.apply(this, arguments);
                    }
                };
            }
            features.constructor.prototype = newObject;
            angular.extend(features.constructor.prototype, features);
            features.constructor.__super__ = klass;
            return features.constructor;
        }
    }])

    .provider('atlasCredentialsFactory', [function () {
        /* (Integer) */
        var expiryWindow = this.expiryWindow = 15;

        this.$get = ['atlasUtil', 'atlasSecurityTokenService', function (atlasUtil, atlasSecurityTokenService) {
            return {
                create: createAbstract,
                createWebIdentityCredentials: createWebIdentityCredentials,
            }

            function createAbstract() {
                var credentials = {
                    /* (Integer) the window size in seconds to attempt refreshing of
                     * credentials before the expireTime occurs
                     */
                    expiryWindow: expiryWindow,
                    /* (void) Gets the existing credentials, refreshing them if they
                     * are not yet loaded or have expired. Users should call
                     * this method before using refresh(), as this will not
                     * attempt to reload credentials when they are already
                     * loaded into the object.
                     */
                    get : get,
                    /*
                     * (Boolean) Returns whether the credentials object should call refresh()
                     */
                    needsRefresh: needsRefresh,
                    /*
                     * (void) Refreshes the credentials. Users should call get() before
                     * attempting to forcibly refresh credentials.
                     */
                    refresh: refresh,
                };
                /* (Boolean) Returns whether the credentials have been expired and require a refresh. */
                credentials.expired = false;
                /* (Date) Returns a time when credentials should be considered expired. */
                credentials.expireTime = null;

                if (arguments.length === 1 && typeof arguments[0] === 'object') {
                    var arg = arguments[0];
                    /* (String) — the atlas access key ID */
                    credentials.accessKeyId = arg.accessKeyId;
                    /* (String) — the atlas secret access key */
                    credentials.secretAccessKey = arg.secretAccessKey;
                    /* (String) — the optional atlas session token */
                    credentials.sessionToken = arg.sessionToken;
                }
                else {
                    credentials.accessKeyId = arguments[0];
                    credentials.secretAccessKey = arguments[1];
                    credentials.sessionToken = arguments[2];
                }
                return credentials;


                function get(callback) {
                    if (this.needsRefresh()) {
                        this.refresh(function(err) {
                            if (!err) {
                                this.expired = false; // reset expired flag
                            }
                            if (callback) callback(err);
                        });
                    }
                    else if (callback) {
                        callback();
                    }
                }

                function needsRefresh() {
                    var currentTime = atlasUtil.date.getDate().getTime();
                    var adjustedTime = new Date(currentTime + this.expiryWindow * 1000);
                    if (this.expireTime && adjustedTime > this.expireTime) {
                        return true;
                    }
                    else {
                        return this.expired || !this.accessKeyId || !this.secretAccessKey;
                    }
                }

                function refresh(callback) {
                    this.expired = false;
                    callback();
                }
            }

            /**
              * Creates a new credentials object.
              * @param (see atlasSecurityTokenService.assumeRoleWithWebIdentity)
              * @example Creating a new credentials object
              *   atlasGlobalConfig.credentials = atlasCredentialsFactory.createWebIdentityCredentials({
              *     RoleArn: 'arn:atlas:iam::<ATLAS_ACCOUNT_ID>:role/<WEB_IDENTITY_ROLE_NAME>',
              *     WebIdentityToken: 'ACCESS_TOKEN',       // token from identity service
              *     RoleSessionName: 'web'                  // optional name, defaults to web-identity
              *   });
              * @see atlasSecurityTokenService.assumeRoleWithWebIdentity
              */
            function createWebIdentityCredentials(params) {
                if (typeof params === 'object') {
                    var credentials = createAbstract(params);
                    credentials.expired = true;
                    credentials.params = params;
                    credentials.params.RoleSessionName = credentials.params.RoleSessionName || 'web-identity';
                    credentials.data = null;
                    credentials.refresh = refresh;
                    credentials.createClients = createClients;
                    return credentials;
                }
                throw 'Trying to create WebIdentityCredentials without params';

                /** Refreshes credentials using atlasSecurityTokenService.assumeRoleWithWebIdentity
                 * @callback callback function(err)
                 *      Called when the STS service responds (or fails). When
                 *      this callback is called with no error, it means that the credentials
                 *      information has been loaded into the object (as the `accessKeyId`,
                 *      `secretAccessKey`, and `sessionToken` properties).
                 *      @param err [Error] if an error occurred, this value will be filled
                 */
                function refresh(callback) {
                    var self = this;
                    self.createClients();
                    if (!callback)
                        callback = function(err) { if (err) throw err; };
                    self.service.assumeRoleWithWebIdentity(function (err, data) {
                        if (!err) {
                            self.expired = false;
                            self.data = data;
                            self.service.credentialsFrom(data, self);
                        }
                        else {
                            self.data = null;
                        }
                        callback(err);
                    });
                }


                function createClients() {
                    this.service = this.service || atlasSecurityTokenService({params: this.params});
                }
            }
        }];
    }])

    .factory('atlasRegionConfig', ['atlasUtil', function(atlasUtil) {
        var regionConfig = { /* from region_config.json */
            rules: {
				'*/*': {
					endpoint: 'atlasv5.azurewebsites.net/{service}'
				},
				'ias2server/*': {
					endpoint: 'ias2server/{service}'
				},
			},
            patterns: {}
        };
        return configureEndpoint;

        function configureEndpoint(service) {
            service.isGlobalEndpoint = false;
            var keys = derivedKeys(service);
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                if (!key) continue;
                if (regionConfig.rules.hasOwnProperty(key)) {
                    var config = regionConfig.rules[key];
                    if (typeof config === 'string') {
                        config = regionConfig.patterns[config];
                    }
                    // set global endpoint
                    service.isGlobalEndpoint = !!config.globalEndpoint;
                    // signature version
                    if (!config.signatureVersion)
						config.signatureVersion = 'v4';
                    // merge config
                    applyConfig(service, config);
                }
            }
        }

        function derivedKeys(service) {
            var region = service.config.region;
            var regionPrefix = generateRegionPrefix(region);
            var endpointPrefix = service.api.endpointPrefix;

            return [
                [region, endpointPrefix],
                [regionPrefix, endpointPrefix],
                [region, '*'],
                [regionPrefix, '*'],
                ['*', endpointPrefix],
                ['*', '*']
            ].map(function(item) {
                return item[0] && item[1] ? item.join('/') : null;
            });
        }

        function generateRegionPrefix(region) {
            if (!region) return null;

            var parts = region.split('-');
            if (parts.length < 3) return null;
            return parts.slice(0, parts.length - 2).join('-') + '-*';
        }

        function applyConfig(service, config) {
			if (!service.config)
				service.config = {};
            atlasUtil.each(config, function(key, value) {
                if (key === 'globalEndpoint') return;
                if (service.config[key] === undefined || service.config[key] === null) {
                    service.config[key] = value;
                }
            });
        }
    }])

	.factory('atlasEndpointFactory', ['atlasUtil', 'atlasGlobalConfig', function(atlasUtil, atlasGlobalConfig) {
		/**
		 * Constructs a new endpoint given an endpoint URL. If the
		 * URL omits a protocol (http or https), the default protocol
		 * set in the global {atlasConfig} will be used.
		 *
		 */
		return function create(endpoint, config) {
			if (typeof endpoint === 'undefined' || endpoint === null) {
				throw new Error('Invalid endpoint: ' + endpoint);
			}
			else if (typeof endpoint !== 'string') {
				return angular.extend({}, endpoint);
			}

			if (!endpoint.match(/^http/)) {
				var useSSL = config && config.sslEnabled !== undefined ? config.sslEnabled : atlasGlobalConfig.sslEnabled;
				endpoint = (useSSL ? 'https' : 'http') + '://' + endpoint;
			}
			var instance = atlasUtil.urlParse(endpoint);

			// Ensure the port property is set as an integer
			if (instance.port) {
				instance.port = parseInt(instance.port, 10);
			}
			else {
				instance.port = instance.protocol === 'https:' ? 443 : 80;
			}
			return instance;
		};
	}])

	.factory('atlasServiceFactory', ['atlasUtil', 'atlasGlobalConfig', 'atlasRegionConfig', 'atlasEndpointFactory', function(atlasUtil, atlasGlobalConfig, atlasRegionConfig, atlasEndpointFactory) {
        var _serviceMap = {};
        /* The service class representing an atlas service. */
		var emptyService = {
			api: {},
            defaultRetryCount: 3,
            validateService: function validateService() {
            },
            getLatestServiceClass: function getLatestServiceClass(version) {
                throw 'getLatestServiceClass: Not implemented!';
            },
            getLatestServiceVersion: function getLatestServiceVersion(version) {
                throw 'getLatestServiceVersion: Not implemented!';
            },
            makeRequest: function makeRequest(operation, params, callback) {
                throw 'makeRequest: Not implemented!';
            },
            /**
             * Calls an operation on a service with the given input parameters, without
             * any authentication data. This method is useful for "public" API operations.
             *      @param operation [String] the name of the operation to call on the service.
             *      @param params [map] a map of input options for the operation
             *      @callback callback function(err, data)
             *          If a callback is supplied, it is called when a response is returned
             *          from the service.
             *          @param err [Error] the error object returned from the request.
             *              Set to `null` if the request is successful.
             *          @param data [Object] the de-serialized data returned from
             *              the request. Set to `null` if a request error occurs.
             */
            makeUnauthenticatedRequest: function (operation, params, callback) {
                if (typeof params === 'function') {
                    callback = params;
                    params = {};
                }
                var request = this.makeRequest(operation, params).toUnauthenticated();
                return callback ? request.send(callback) : request;
            },
            waitFor: function waitFor(state, params, callback) {
                throw 'waitFor: Not implemented!';
            },
            addAllRequestListeners: function addAllRequestListeners(request) {
                throw 'addAllRequestListeners: Not implemented!';
            },
            setupRequestListeners: function setupRequestListeners() {
                // Override this method to setup any custom request listeners for each
                // new request to the service.
            },
            getSignerClass: function getSignerClass() {
                throw 'getSignerClass: Not implemented!';
            },
            serviceInterface: function serviceInterface() {
                throw 'serviceInterface: Not implemented!';
            },
            successfulResponse: function successfulResponse(resp) {
                throw 'successfulResponse: Not implemented!';
            },
            numRetries: function numRetries() {
                throw 'numRetries: Not implemented!';
            },
            retryDelays: function retryDelays() {
                throw 'retryDelays: Not implemented!';
            },
            retryableError: function retryableError(error) {
                throw 'retryableError: Not implemented!';
            },
            networkingError: function networkingError(error) {
                throw 'networkingError: Not implemented!';
            },
            expiredCredentialsError: function expiredCredentialsError(error) {
                throw 'expiredCredentialsError: Not implemented!';
            },
            throttledError: function throttledError(error) {
                throw 'throttledError: Not implemented!';
            },
            paginationConfig: function paginationConfig(operation, throwException) {
                throw 'paginationConfig: Not implemented!';
            },
        };

        return {
            create: create,
            defineService: defineService,
            hasService: hasService,
        };

        function hasService(identifier) {
            return _serviceMap.hasOwnProperty(identifier);
        }

        function create(features) {
            var instance = angular.extend(emptyService, features || {});
            var serviceClass = loadServiceClass(instance, config || {});
            if (serviceClass)
                return new ServiceClass(config);
			initialize(instance, config);
			return instance;
        }

		function loadServiceClass(instance, serviceConfig) {
			var config = serviceConfig;
			if (!atlasUtil.isEmpty(instance.api)) {
				return null;
			}
			else if (config.apiConfig) {
				return AWS.Service.defineServiceApi(instance.constructor, config.apiConfig);
			}
			else if (!instance.constructor.services) {
				return null;
			}
			else {
				config = new AWS.Config(AWS.config);
				config.update(serviceConfig, true);
				var version = config.apiVersions[instance.constructor.serviceIdentifier];
				version = version || config.apiVersion;
				return this.getLatestServiceClass(version);
			}
		}

		function initialize(instance, config) {
			var svcConfig = atlasGlobalConfig[instance.serviceIdentifier];
			instance.config = angular.extend({}, atlasGlobalConfig, svcConfig, config);
			instance.validateService();
			if (!instance.config.endpoint) {
				atlasRegionConfig(instance);
			}
			resolveTemplatedEndpoint(instance);
			instance.endpoint = atlasEndpointFactory(instance.config.endpoint, instance.config);
			console.log(instance.endpoint)
		}

		function resolveTemplatedEndpoint(instance) {
			var endpoint = instance.config.endpoint;
			if (typeof endpoint !== 'string') return;

			var e = endpoint;
		    e = e.replace(/\{service\}/g, instance.api.endpointPrefix);
		    e = e.replace(/\{region\}/g, instance.config.region);
		    e = e.replace(/\{scheme\}/g, instance.config.sslEnabled ? 'https' : 'http');
			instance.config.endpoint = e;
		}

        /**
          * Defines a new Service class using a service identifier and list of versions
          * including an optional set of features (functions) to apply to the class
          * prototype.
          *
          * @param serviceIdentifier [String] the identifier for the service
          * @param versions [Array<String>] a list of versions that work with this service
          * @param features [Object] an object to attach to the prototype
          * @return [Class<Service>] the service class defined by this function.
          */
        function defineService(serviceIdentifier, versions, features) {
            _serviceMap[serviceIdentifier] = true;
            if (!angular.isArray(versions)) {
                features = versions;
                versions = [];
            }
            //var svc = angular.extend({}, emptyService, features || {});
			var svc = create(features || {});
            if (typeof serviceIdentifier === 'string') {
                addVersions(svc, versions);
                var identifier = svc.serviceIdentifier || serviceIdentifier;
                svc.serviceIdentifier = identifier;
            }
            else { // defineService called with an API
                svc.prototype.api = serviceIdentifier;
                defineMethods(svc);
            }
            return svc;
        }

        function addVersions(svc, versions) {
            if (!angular.isArray(versions))
                versions = [versions];
            svc.services = svc.services || {};
            for (var i = 0; i < versions.length; i++) {
                if (svc.services[versions[i]] === undefined) {
                    svc.services[versions[i]] = null;
                }
            }
            svc.apiVersions = Object.keys(svc.services).sort();
        }

        function defineServiceApi(superclass, version, apiConfig) {
            throw 'defineServiceApi: Not implemented!';
        }

        function defineMethods(svc) {
            atlasUtil.each(svc.prototype.api.operations, function iterator(method) {
                if (svc.prototype[method]) return;
                svc.prototype[method] = function (params, callback) {
                    return this.makeRequest(method, params, callback);
                };
            });
        }


    }])

    .factory('atlasSecurityTokenService', ['atlasServiceFactory', function(atlasServiceFactory) {
        var factory = function create(params) {
            var instance = atlasServiceFactory.create(params);
            instance.assumeRoleWithWebIdentity = function (params, callback) {
                this.makeUnauthenticatedRequest('assumeRoleWithWebIdentity', params, callback);
            };
            /**
             * Creates a credentials object from STS response data containing
             * credentials information. Useful for quickly setting atlas credentials.
             *
             * @note This is a low-level utility function. If you want to load temporary
             *     credentials into your process for subsequent requests to atlas resources,
             *     you should use {atlasCredentialsFactory.createTemporaryCredentials} instead.
             *  @param data [map] data retrieved from a call to {getFederatedToken},
             *     {getSessionToken}, {assumeRole}, or {assumeRoleWithWebIdentity}.
             *  @param credentials [atlasCredentials] an optional credentials object to
             *     fill instead of creating a new object. Useful when modifying an
             *     existing credentials object from a refresh call.
             *  @return [atlasTemporaryCredentials] the set of temporary credentials
             *     loaded from a raw STS operation response.
             */
            instance.credentialsFrom = function credentialsFrom(data, credentials) {
                if (!data) return null;
                if (!credentials) {
                    //credentials = new atlas.TemporaryCredentials();
                    throw 'credentialsFrom: Not implemented!';
                }
                credentials.accessKeyId = data.Credentials.AccessKeyId;
                credentials.secretAccessKey = data.Credentials.SecretAccessKey;
                credentials.sessionToken = data.Credentials.SessionToken;
                credentials.expireTime = data.Credentials.Expiration;
            };
            return instance;
        };
        return factory;
    }])

	.factory('atlasSequentialExecutor', [function() {
		var _events = {};
		return {
			on: on,
			addListener: on,
			/** Adds or copies a set of listeners from another list of
			 * listeners or SequentialExecutor object.
			 *
			 * @param listeners [map<String, Array<Function>>]
			 * @return [atlasSequentialExecutor] the emitter object, for chaining.
			 * @example Adding listeners from a map of listeners
			 *   emitter.addListeners({
			 *     event1: [function() { ... }, function() { ... }],
			 *     event2: [function() { ... }]
			 *   });
			 *   emitter.emit('event1'); // emitter has event1
			 */
			addListeners: addListeners,
			/**
			 * Registers an event with {on} and saves the callback handle function
			 * as a property on the emitter object using a given `name`.
			 * @param name [String] the property name to set on this object containing
			 *   the callback function handle so that the listener can be removed in
			 *   the future.
			 * @example Adding a named listener DATA_CALLBACK
			 *   var listener = function() { doSomething(); };
			 *   emitter.addNamedListener('DATA_CALLBACK', 'data', listener);
			 *
			 *   // the following prints: true
			 *   console.log(emitter.DATA_CALLBACK == listener);
			 */
			addNamedListener: addNamedListener,
			/**
			 * Helper method to add a set of named listeners using
			 * {addNamedListener}. The callback contains a parameter
			 * with a handle to the `addNamedListener` method.
			 *
			 * @callback callback function(add)
			 *   The callback function is called immediately in order to provide
			 *   the `add` function to the block. This simplifies the addition of
			 *   a large group of named listeners.
			 *   @param add [Function] the {addNamedListener} function to call
			 *     when registering listeners.
			 * @example Adding a set of named listeners
			 *   emitter.addNamedListeners(function(add) {
			 *     add('DATA_CALLBACK', 'data', function() { ... });
			 *     add('OTHER', 'otherEvent', function() { ... });
			 *     add('LAST', 'lastEvent', function() { ... });
			 *   });
			 *
			 *   // these properties are now set:
			 *   emitter.DATA_CALLBACK;
			 *   emitter.OTHER;
			 *   emitter.LAST;
			 */
			addNamedListeners: addNamedListeners,
			removeListener: removeListener,
			removeAllListeners: removeAllListeners
		}

		function on(eventName, listener) {
			if (_events[eventName]) {
				_events[eventName].push(listener);
			}
			else {
				_events[eventName] = [listener];
			}
			return this;
		}

		function onAsync(eventName, listener) {
			listener._isAsync = true;
			return on(eventName, listener);
		}

		function listeners(eventName) {
    		return _events[eventName] ? _events[eventName].slice(0) : [];
		}

		function addNamedListener(name, eventName, callback) {
			this[name] = callback;
			addListener(eventName, callback);
			return this;
		}

		function addNamedAsyncListener(name, eventName, callback) {
			callback._isAsync = true;
			return addNamedListener(name, eventName, callback);
		}

		function addNamedListeners(callback) {
			var self = this;
			callback(
				function() {
					self.addNamedListener.apply(self, arguments);
				},
				function() {
					self.addNamedAsyncListener.apply(self, arguments);
				}
			);
			return this;
		}

		function addListeners(listeners) {
			var self = this;
			// extract listeners if parameter is an SequentialExecutor object
			if (listeners._events) listeners = listeners._events;

			atlasUtil.each(listeners, function(event, callbacks) {
				atlasUtil.arrayEach(callbacks, function(callback) {
					self.on(event, callback);
				});
			});
			return self;
		}

		function removeListener(eventName, listener) {
			var listeners = _events[eventName];
			if (listeners) {
				var length = listeners.length;
				var position = -1;
				for (var i = 0; i < length; ++i) {
					if (listeners[i] === listener) {
						position = i;
					}
				}
				if (position > -1) {
					listeners.splice(position, 1);
				}
			}
			return this;
		}
		function removeAllListeners(eventName) {
			if (eventName) {
				delete _events[eventName];
			}
			else {
				_events = {};
			}
			return this;
		}
		function emit(eventName, eventArgs, doneCallback) {
			if (!doneCallback) doneCallback = function() { };
			var listeners = listeners(eventName);
			var count = listeners.length;
			callListeners(listeners, eventArgs, doneCallback);
			return count > 0;
		}
		function callListeners(listeners, args, doneCallback) {
			var self = this;
			function callNextListener(err) {
				if (err) {
					doneCallback.call(self, err);
				}
				else {
					self.callListeners(listeners, args, doneCallback);
				}
			}

			while (listeners.length > 0) {
				var listener = listeners.shift();
				if (listener._isAsync) { // asynchronous listener
					listener.apply(self, args.concat([callNextListener]));
					return; // stop here, callNextListener will continue
				}
				else { // synchronous listener
					listener.apply(self, args);
				}
			}
			doneCallback.call(self);
		}
	}])

	.factory('atlasConfigFactory', ['atlasUtil', 'atlasGlobalConfig', 'atlasServiceFactory', 'atlasCredentialsFactory', function (atlasUtil, atlasGlobalConfig, atlasServiceFactory, atlasCredentialsFactory) {

		var factory = {
			create: create,
		};
		return factory;


		function create(options) {
			if (options === undefined) options = {};
			options = extractCredentials(options);

			var config = {
				set : function set(property, value, defaultValue) {
					if (value === undefined) {
						if (defaultValue === undefined) {
							defaultValue = atlasGlobalConfig[property];
						}
						if (typeof defaultValue === 'function') {
							this[property] = defaultValue.call(this);
						}
						else {
							this[property] = defaultValue;
						}
					}
					else if (property === 'httpOptions' && this[property]) {
						// deep merge httpOptions
						this[property] = angular.extend(this[property], value);
					}
					else {
						this[property] = value;
					}
				},
				update: function(options, allowUnknownKeys) {
					allowUnknownKeys = allowUnknownKeys || false;
					options = extractCredentials(options);
					for (var key in options) {
						if (allowUnknownKeys || atlasGlobalConfig.hasOwnProperty(key) || hasService(key)) {
							this.set(key, options[key]);
						}
					};
				},
				clear: function clear() {
					for (var key in atlasGlobalConfig) {
						delete this[key];
					};

					// reset credential provider
					this.set('credentials', undefined);
					this.set('credentialProvider', undefined);
				},
				getCredentials: function getCredentials(callback) {
					var self = this;
					if (self.credentials) {
						if (typeof self.credentials.get === 'function') {
							getAsyncCredentials();
						}
						else { // static credentials
							getStaticCredentials();
						}
					}
					else if (self.credentialProvider) {
						self.credentialProvider.resolve(function(err, creds) {
							if (err) {
								err = credError('Could not load credentials from any providers', err);
							}
							self.credentials = creds;
							finish(err);
						});
					}
					else {
						finish(credError('No credentials to load'));
					}

					function finish(err) {
				      callback(err, err ? null : self.credentials);
				    }
					function credError(msg, err) {
						return atlasUtil.error(err || new Error(), {
							code: 'CredentialsError', message: msg
						});
				    }
					function getAsyncCredentials() {
						self.credentials.get(function(err) {
							if (err) {
								var msg = 'Could not load credentials from ' +
									self.credentials.constructor.name;
          						err = credError(msg, err);
        					}
        					finish(err);
      					});
    				}
					function getStaticCredentials() {
						var err = null;
						if (!self.credentials.accessKeyId || !self.credentials.secretAccessKey) {
							err = credError('Missing credentials');
						}
						finish(err);
					}
				},
			};
			for (var key in atlasGlobalConfig) {
				config.set(key, options[key], config[key]);
			}
			return config;
		}

		function hasService(serviceIdentifier) {
			return atlasServiceFactory.hasService(serviceIdentifier);
		}

		/* Extracts accessKeyId, secretAccessKey and sessionToken from a configuration hash. */
		function extractCredentials(options) {
    		if (options.accessKeyId && options.secretAccessKey) {
				options = angular.extend({}, options);
				options.credentials = atlasCredentialsFactory.create(options);
			}
    		return options;
		}
	}])

	.factory('atlasApiLoader', ['atlasUtil', function (atlasUtil) {
		var __dirname = '__dirname';
		var files = {
			'__dirname/../apis/metadata.json': {
				//'cloudwatchlogs': {
				//	'prefix': 'logs',
				//	'name': 'CloudWatchLogs',
				//	'versions': [],
				//},
				'identity': {
					'name': 'atlasIdentity',
					'versions': [ '5.0' ],
				},
				'appsettings': {
					'name': 'atlasAppsettings',
					'versions': [ '5.0' ],
				},
				'orgmodel': {
					'name': 'atlasOrgmodel',
					'versions': [ '5.0' ],
				},
				'case': {
					'name': 'atlasCase',
					'versions': [ '5.0' ],
				},
				'task': {
					'name': 'atlasTask',
					'versions': [ '5.0' ],
				},
				'cmis': {
					'name': 'atlasCmis',
					'versions': [ '5.0' ],
				},
				'template': {
					'name': 'atlasTemplate',
					'versions': [ '5.0' ],
				},
				'rule': {
					'name': 'atlasRule',
					'versions': [ '5.0' ],
				},
				'data': {
					'name': 'atlasData',
					'versions': [ '5.0' ],
				},
			},
			'__dirname/../apis/sts-2011-06-16.min.json': {
				version: '5.0',
				metadata: {
					apiVersion: '2011-06-16',
					endpointPrefix: 'sts',
					globalEndpoint: 'sts.amazonaws.com',
					serviceAbbreviation: 'AWS STS',
					serviceFullName: 'AWS Security Token Service',
					signatureVersion: 'v4',
					xmlNamespace: 'https://sts.amazonaws.com/doc/2011-06-15/',
					protocol: 'query'
				},
				operations: {
					"GetSessionToken": {
						input: {},
						output: {},
					},
				},
				shapes: {
				}
			}
		};
		var fs = {
			readdirSync: function(apiRoot) {
				return files.keys;
			},
			existsSync: function(path) {
				return files[path] ? true : false;
			}
		};
		function require(path) {
			var json = files[path];
			if (json)
				return json;
			throw path + ' not found!'
		}
		var path = {
			join: function() {
				var s = arguments[0];
				for (var i = 1; i < arguments.length; i++)
					s += '/' + arguments[i];
				return s;
			}
		};

		var apiRoot = path.join(__dirname, '..', 'apis');
		var serviceMap = null;
		var serviceIdentifiers = [];
		var serviceNames = [];

		var service = {
			serviceVersions: serviceVersions,
			serviceName: serviceName,
			serviceIdentifier: serviceIdentifier,
			serviceFile: serviceFile,
			load: load,
		};
		Object.defineProperty(service, 'services', {
			enumerable: true, get: getServices
		});
		Object.defineProperty(service, 'serviceNames', {
			enumerable: true, get: getServiceNames
		});
		return service;

		function buildServiceMap() {
			if (serviceMap !== null) return;

			// load info file for API metadata:
			serviceMap =  require(path.join(apiRoot, 'metadata.json'));

			var prefixMap = {};
			Object.keys(serviceMap).forEach(function(identifier) {
				serviceMap[identifier].prefix = serviceMap[identifier].prefix || identifier;
				prefixMap[serviceMap[identifier].prefix] = identifier;
			});

			/*
			fs.readdirSync(apiRoot).forEach(function (file) {
				var match = file.match(/^(.+?)-(\d+-\d+-\d+)\.(normal|min)\.json$/);
				if (match) {
					var id = prefixMap[match[1]], version = match[2];
					if (serviceMap[id]) {
						serviceMap[id].versions = serviceMap[id].versions || [];
						if (serviceMap[id].versions.indexOf(version) < 0) {
							serviceMap[id].versions.push(version);
						}
					}
				}
			});
			*/

			Object.keys(serviceMap).forEach(function(identifier) {
				serviceMap[identifier].versions = serviceMap[identifier].versions.sort();
				serviceIdentifiers.push(identifier);
				serviceNames.push(serviceMap[identifier].name);
			});
		}
		function getServices() {
			buildServiceMap();
			return serviceIdentifiers;
		}
		function getServiceNames() {
			buildServiceMap();
			return serviceNames;
		}
		function serviceVersions(svc) {
			buildServiceMap();
			svc = serviceIdentifier(svc);
			return serviceMap[svc] ? serviceMap[svc].versions : null;
		}
		function serviceName(svc) {
			buildServiceMap();
			svc = serviceIdentifier(svc);
			return serviceMap[svc] ? serviceMap[svc].name : null;
		}
		function serviceFile(svc, version) {
			buildServiceMap();
			svc = serviceIdentifier(svc);
			if (!serviceMap[svc]) return null;

			var prefix = serviceMap[svc].prefix || svc;
			var filePath;
			//['min', 'api', 'normal'].some(function(testSuffix) {
				var testSuffix = 'min';
				filePath = apiRoot + '/' + prefix.toLowerCase() + '-' + version + '.' + testSuffix + '.json';
			//	return fs.existsSync(filePath);
			//});
			return filePath;
		}

		function paginatorsFile(svc, version) {
			buildServiceMap();
			svc = serviceIdentifier(svc);
			if (!serviceMap[svc]) return null;

			var prefix = serviceMap[svc].prefix || svc;
			return apiRoot + '/' + prefix + '-' + version + '.paginators.json';
		}
		function waitersFile(svc, version) {
			buildServiceMap();
			svc = serviceIdentifier(svc);
			if (!serviceMap[svc]) return null;

			var prefix = serviceMap[svc].prefix || svc;
			return apiRoot + '/' + prefix + '-' + version + '.waiters.json';
		}

		function load(svc, version) {
			buildServiceMap();
			svc = serviceIdentifier(svc);
			if (version === 'latest') version = null;
			version = version || serviceMap[svc].versions[serviceMap[svc].versions.length - 1];
			if (!serviceMap[svc]) return null;

			var api = require(serviceFile(svc, version));

			// Try to load paginators
			if (fs.existsSync(paginatorsFile(svc, version))) {
				var paginators = require(paginatorsFile(svc, version));
				api.paginators = paginators.pagination;
			}

			// Try to load waiters
			if (fs.existsSync(waitersFile(svc, version))) {
				var waiters = require(waitersFile(svc, version));
				api.waiters = waiters.waiters;
			}

			return api;
		}
		function serviceIdentifier(svc) {
			return svc.toLowerCase();
		}
	}])

	.provider('atlasCore', [function() {
		this.$get = [
			'atlasUtil',
			'atlasConfigFactory',
			'atlasServiceFactory',
			'atlasCredentialsFactory',
			'atlasSequentialExecutor',
			function (
				atlasUtil,
				atlasConfigFactory,
				atlasServiceFactory,
				atlasCredentialsFactory,
				atlasSequentialExecutor) {
			var core = {
				/**
				* CONSTANT
				*/
				VERSION: '0.1',
				/**
				* A set of utility methods for use with the atlas SDK.
				*/
				util: atlasUtil,
				/* @api private */
				apiLoader: function() { throw new Error('atlas.$get: No API loader set'); },
				/* @api private */
				//Signers: {},
				/* @api private */
				//Protocol: {
				//	Json: require('./protocol/json'),
				//	Query: require('./protocol/query'),
				//	Rest: require('./protocol/rest'),
				//	RestJson: require('./protocol/rest_json'),
				//	RestXml: require('./protocol/rest_xml')
				//},
				/* @api private */
				//XML: {
				//	Builder: require('./xml/builder'),
				//	Parser: null // conditionally set based on environment
				//},
				/* @api private */
				//JSON: {
				//	Builder: require('./json/builder'),
				//	Parser: require('./json/parser')
				//},
				/* @api private */
				//Model: {
				//	Api: require('./model/api'),
				//	Operation: require('./model/operation'),
				//	Shape: require('./model/shape'),
				//	Paginator: require('./model/paginator'),
				//	ResourceWaiter: require('./model/resource_waiter')
				//},
			};

			// DONE: require('./service');
			core.service = atlasServiceFactory;

			// DONE: require('./credentials');
			core.credentials = atlasCredentialsFactory;

			//require('./credentials/credential_provider_chain');
			//require('./credentials/temporary_credentials');
			//require('./credentials/web_identity_credentials');
			//require('./credentials/cognito_identity_credentials');
			//require('./credentials/saml_credentials');

			/**
			* The main configuration class used by all service objects to set
			* the region, credentials, and other options for requests.
			*/
			// DONE: require('./config');
			core.config = atlasConfigFactory.create();

			//require('./http');

			/**
			* @readonly
			* @return [atlasSequentialExecutor] a collection of global event listeners that
			*   are attached to every sent request.
			* @see atlasRequest for a list of events to listen for
			* @example Logging the time taken to send a request
			*   atlas.events.on('send', function startSend(resp) {
			*     resp.startTime = new Date().getTime();
			*   }).on('complete', function calculateTime(resp) {
			*     var time = (new Date().getTime() - resp.startTime) / 1000;
			*     console.log('Request took ' + time + ' seconds');
			*   });
			*
			*   atlas.<serviceName>.<operationName>(); // prints 'Request took 0.285 seconds'
			*/
			// DONE: require('./sequential_executor');
			core.events = atlasSequentialExecutor;

			//require('./event_listeners');
			//require('./request');
			//require('./response');
			//require('./resource_waiter');
			//require('./signers/request_signer');
			//require('./param_validator');
			return core;
		}];
	}])

	.provider('atlas', [function () {
        this.$get = [
			'atlasCore',
			'atlasApiLoader',
			function atlasFactory(
				atlasCore,
				atlasApiLoader) {

			/********************* core **********************/
			var atlas = angular.extend({}, atlasCore)

			/********************* atlas **********************/
			// Use default API loader function
			// DONE: require('./api_loader').load;
			atlas.apiLoader = atlasApiLoader.load;

			// Load the xml2js XML parser
			// AWS.XML.Parser = require('./xml/node_parser');

			// Load Node HTTP client
			// require('./http/node');

			// Load all service classes
			// DONE: require('./services');
			atlasApiLoader.services.forEach(function(identifier) {
				var name = atlasApiLoader.serviceName(identifier);
				var versions = atlasApiLoader.serviceVersions(identifier);
				atlas[name] = function(settings) {
					return atlas.service.defineService(identifier, versions);
				}
				// load any customizations from lib/services/<svcidentifier>.js
				//var svcFile = path.join(__dirname, 'services', identifier + '.js');
				//if (fs.existsSync(svcFile)) require('./services/' + identifier);
			});

			// Load custom credential providers
			// require('./credentials/ec2_metadata_credentials');
			// require('./credentials/environment_credentials');
			// require('./credentials/file_system_credentials');
			// require('./credentials/shared_ini_file_credentials');

			// Setup default chain providers
			// AWS.CredentialProviderChain.defaultProviders = [
			//   function () { return new AWS.EnvironmentCredentials('AWS'); },
			//   function () { return new AWS.EnvironmentCredentials('AMAZON'); },
			//   function () { return new AWS.SharedIniFileCredentials(); },
			//   function () { return new AWS.EC2MetadataCredentials(); }
			// ];

			// Update configuration keys
			// AWS.util.update(AWS.Config.prototype.keys, {
			// 	credentials: function () {
			// 		var credentials = null;
			// 		new AWS.CredentialProviderChain([
			// 			function () { return new AWS.EnvironmentCredentials('AWS'); },
			// 			function () { return new AWS.EnvironmentCredentials('AMAZON'); },
			// 			function () { return new AWS.SharedIniFileCredentials(); }
			// 		]).resolve(function(err, creds) {
			// 			if (!err) credentials = creds;
			// 		});
			// 		return credentials;
			// 	},
			// 	credentialProvider: function() {
			// 		return new AWS.CredentialProviderChain();
			// 	},
			// 	region: function() {
			// 		return process.env.AWS_REGION || process.env.AMAZON_REGION;
			// 	}
			// });

			// Reset configuration
			// AWS.config = new AWS.Config();

            return atlas;
        }];
    }])
    ;
