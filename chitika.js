try {
    if (window.CHITIKA &&
        top.CHITIKA &&
        top.CHITIKA !== window.CHITIKA) {
        top.CHITIKA.units = top.CHITIKA.units.append(window.CHITIKA.units);
        delete(window.CHITIKA);
    }
    window.CHITIKA = window.CHITIKA ? window.CHITIKA : top.CHITIKA;
    window.CHITIKA_ADS = window.CHITIKA_ADS ? window.CHITIKA_ADS : top.CHITIKA_ADS;
} catch (e) {}

window.CHITIKA = window.CHITIKA ? window.CHITIKA : {};
window.CHITIKA_ADS = window.CHITIKA_ADS ? window.CHITIKA_ADS : (function() {
    "use strict";
    var already_bridged     = false;
    var debug_pixels        = (Math.random() < 0.1 ? true : false);
    var jq                  = undefined;
    var lightbox_modal      = undefined;
    var lightbox_container  = undefined;
    var mobile              = undefined;
    var size_screen         = undefined;
    var size_scroll         = undefined;
    var size_viewport       = undefined;
    var snippet_cache       = undefined;
    var time_start          = (debug_pixels ? new Date() : 0);
    var url_data_cache      = undefined;
    var version             = "5.16";

    var amm_getads_map = {
        'ch_alternate_ad_url'       : 'alternate_ad_url',
        'ch_alternate_css_url'      : 'alternate_css_url',
        'ch_cid'                    : 'cid',
        'ch_city'                   : 'city',
        'ch_client'                 : 'publisher',
        'ch_color_bg'               : 'color_bg',
        'ch_color_border'           : 'color_border',
        'ch_color_site_link'        : 'color_site_link',
        'ch_color_text'             : 'color_text',
        'ch_color_title'            : 'color_title',
        'ch_fluidH'                 : 'fluidH',
        'ch_font_text'              : 'font_text',
        'ch_font_title'             : 'font_title',
        'ch_height'                 : 'height',
        'ch_nump'                   : 'nump',
        'ch_queries'                : 'queries',
        'ch_query'                  : 'query',
        'ch_sid'                    : 'sid',
        'ch_state'                  : 'state',
        'ch_target'                 : 'target',
        'ch_third_party_tracker'    : 'third_party_tracker',
        'ch_where'                  : 'where',
        'ch_width'                  : 'width',
        'ch_zip'                    : 'zip'
    };

    // For a long time we gave silly instructions to tell is by
    // parameter some default colors. That's a waste of time.
    // Skip them.
    var default_params = {
        'color_bg'          : '^#?ffffff',
        'color_border'      : '^#?ffffff',
        'color_site_link'   : '^#?0000cc',
        'color_text'        : '^#?000000',
        'color_title'       : '^#?0000cc'
    };

    function drop_it_like_its_hot(response) {
        if (!response) { return; }
        var unit            = CHITIKA.units[response.unit_id];
        var frame           = unit.frames[0];
        if (!unit.ad_url_params || !frame) { return; }
        for (var k in response.extra_params) {
            var v = response.extra_params[k];
            unit.ad_url_params = param_concat_escape(unit.ad_url_params, k, v);
        }
        var url = CHITIKA.proto + '://' + CHITIKA.host + '/minimall' + unit.ad_url_params;
        add_script(url, frame.contentWindow.document);
    }

    var lightbox_config_internal = {
        'border'            : '1px solid #acacac',
        'borderRadius'      : '1px',
        'boxShadow'         : '0px 0px 10px 5px #a2a2a2',
        'cid'               : undefined,
        'close_handler'     : lightbox_hide,
        'close_height'      : '18px',
        'close_image'       : 'url(http://images.chitika.net/buttons/close_metro.png)',
        'close_right'       : '5px',
        'close_top'         : '5px',
        'close_width'       : '18px',
        'height_max'        : 500,
        'height_min'        : 180,
        'height_percent'    : 0.6,
        'modal_color'       : '#888888',
        'modal_opacity'     : 0.40,
        'padding'           : '20px 10px 10px 10px',
        'sid'               : 'lightbox',
        'spinner_url'       : 'http://images.chitika.net/spinner.gif',
        'width_max'         : 700,
        'width_min'         : 300,
        'width_percent'     : 0.65
    };

    var product_activation_map = {
    };

    var window_data = {
        'top_accessible'    : false,
        'top_same'          : false
    };

    try {
        if (window === top) { window_data.top_same = true; }
        var l = top.document.location;
        window_data.top_accessible = true;
    } catch (e) {}

    jq = window.jQuery;
    try {
        var w = window;
        while (!jq && w !== w.parent) {
            w = w.parent;
            jq = w.jQuery;
        }
    } catch (e) {}

    function add_script(url, d) {
        if (d === undefined) {d = document;}
        if (typeof(url) !== 'string') {return undefined;}
        var h = d.getElementsByTagName('head')[0];
        if (!h) {return undefined;}
        var s = d.createElement('script');
        s.type = 'text/javascript';
        s.src = url;
        h.appendChild(s);
        return s;
    }

    function animate(container, frames, start_pos, target_pos) {
        animation_helper(container, 1, frames, start_pos, target_pos)();
    }

    // NOTE: frames here refers to the number of frames to draw, not a
    //       collection of iframes.
    function animation_helper(container, c, frames, start_pos, target_pos) {
        return function() {
            for (var k in target_pos) {
                // 1: Discovery.
                var end_at = target_pos[k];
                var start_at = start_pos[k];

                // 2: Figure out how much to move for this round.
                var total_movement = end_at - start_at;
                var new_offset = total_movement * (Math.pow(c, 4) / Math.pow(frames, 4));
                var stop_at = start_at + new_offset;

                // 3: Move there.
                if (k == 'l') {
                    container.style.left = stop_at + 'px';
                } else if (k == 't') {
                    container.style.top = stop_at + 'px';
                } else if (k == 'r') {
                    container.style.right = stop_at + 'px';
                } else if (k == 'b') {
                    container.style.bottom = stop_at + 'px';
                }
            }
            if (c < frames) {
                setTimeout(animation_helper(container,
                                            ++c,
                                            frames,
                                            start_pos,
                                            target_pos),
                           20);
            }
        };
    }

    function append_func(obj, event, fun) {
        if (obj.addEventListener) {
            obj.addEventListener(event, fun, false);
        } else {
            obj.attachEvent('on' + event, fun);
        }
    }

    function attach_close(container, properties, fun, d) {
        if (d === undefined) { d = document; }
        var button = d.createElement('a');
        button.href = "#chitika_close_button";
        button.style.background = "url(http://images.chitika.net/buttons/close_round_white_on_red.png)";
        button.style["background-repeat"] = 'no-repeat';
        button.style.height = "14px";
        button.style.position = "absolute";
        button.style.right = "0px";
        button.style.top = "0px";
        button.style.width = "16px";
        button.style.zIndex = "999999";

        // Set optional properties on the new button.
        if (typeof(properties) == 'object') { set_properties(button, properties); }

        append_func(button, 'click', fun);
        container.appendChild(button);
    }

    // Backwards compat for amm.js
    function bridge_amm() {
        var w = window;
        // 0: Bail out if backcompat not necessary
        if (w.ch_client === undefined) return;

        // 1: Start with an empty unit description.
        var unit = {};

        // 1.5: If being asked for type=mobile, activate adhesion product.
        if (w.ch_type == 'mobile') {
            CHITIKA.publisher = ch_client;
            var mobile_type = CHITIKA_ADS.mobile_type();
            if (mobile_type >= 1 &&
                mobile_type <= 3) {
                add_script('http://scripts.chitika.net/apps/adhesion.js');
            }
            return;
        }

        // 2: Map properties into a unit instruction.
        for (var n in amm_getads_map) {
            var mapped = amm_getads_map[n];
            var value = w[n];
            if (typeof(value) !== 'function') {
                unit[mapped] = value;
            }
        }

        // 3: Identify the impsrc specially.
        unit['impsrc'] = def(w.ch_impsrc, 'amm-getads-bridge');

        // 4: Save the unit instruction.
        var r = CHITIKA.units.length;
        CHITIKA.units[r] = unit;

        // 5: Write the div beacon.
        document.write('<div id="chitikaAdBlock-'+r+'" class="chitikaAdContainer"></div>');

        // 6: Fixups for the evil past.
        if (unit.publisher == 'magicyellow' &&
            w.ch_hq == 1 &&
            unit.width == 783) {
            delete unit.hq;
            var viewport_size_data = get_viewport_size();
            unit.width = Math.floor(viewport_size_data.w * .866);
        }
        if (unit.publisher == 'salary' &&
            unit.third_party_tracker) {
            // Yes, really. This is not a joke.
            unit.third_party_tracker = decodeURIComponent(decodeURIComponent(unit.third_party_tracker));
        }
        if (unit.publisher == 'thirdage' &&
            w.ch_hq == 1) {
            delete unit.hq;
            if (get_url_data()['url'].indexOf(/\/d\//) === -1) {
                CHITIKA.snippet_priority.unshift('h1');
            } else {
                CHITIKA.snippet_priority.unshift('h3');
            }
        }
        if (unit.publisher == 'epodunk') {
            var m = window.location.hostname.match(/([^\.]+)\.(com|net|org|info|mobi|co\.uk|org\.uk|ac\.uk|uk)$/);
            if (m) { unit.sid = 'epodunk_' + m[1]; }
        } else if (unit.publisher.match(/^epodunk_/)) {
            unit.sid = unit.publisher;
            unit.publisher = 'epodunk';
        }

        // 7: Clear global variables.
        w.ch_alternate_ad_url = undefined;
        w.ch_alternate_css_url = undefined;
        w.ch_cid = undefined;
        w.ch_city = undefined;
        w.ch_fluidH = undefined;
        w.ch_height = undefined;
        w.ch_impsrc = undefined;
        w.ch_metro_id = undefined;
        w.ch_nump = undefined;
        w.ch_query = undefined;
        w.ch_sid = undefined;
        w.ch_state = undefined;
        w.ch_where = undefined;
        w.ch_width = undefined;
        w.ch_zip = undefined;
    }

    // Set the callback function within the iframe.
    function create_callback(unit_id) {
        var frames = CHITIKA.units[unit_id].frames;
        return function(response) {
            if (debug_pixels && unit_id == 0) {
                send_event('mmu0_render', CHITIKA.units[unit_id].impId, {
                    'lc1'       : (response ? 1 : 0),
                    'lc2'       : (response && response.output ? 1 : 0),
                    'hc1'       : (new Date() - time_start)
                });
            }
            if (response === undefined) {
                for (var c = 0; c < frames.length; c++) {
                    var frame = frames[c];
                    frame.style.display = 'none';
                    frame.contentWindow.document.close();
                }
                return;
            }

            // Oh, the magic to come...
            if (!response.units) {
                var copy = [
                    'alturl',
                    'disable_vcpm',
                    'dont_close',
                    'fluidH',
                    'h',
                    'impId',
                    'navajo',
                    'no_steal_jquery',
                    'output',
                    'unit_id',
                    'w'
                ];
                var unit = {};
                for (var c = 0; c < copy.length; c++) {
                    unit[copy[c]] = response[copy[c]];
                }
                response.units = [ unit ];
            }

            if (response.apps) {
                for (var app in response.apps) {
                    if (product_activation_map[app] !== undefined) {
                        product_activation_map[app]();
                    }
                }
                prepare_instructions();
                prepare_ad_urls();
                make_ad_server_call();
            }

            for (var c = 0; c < response.units.length; c++) {
                var unit = response.units[c];
                if (!unit) { continue; }
                render_ad_basic(unit);
                render_ad_inject_content(unit);
            }
            render_ad_js(response);
            render_ad_pixels(response);
            // Trigger a few times to deal with slow DOM rendering.
            setTimeout(handle_resize, 30);
            setTimeout(handle_resize, 60);
            setTimeout(handle_resize, 180);
        }
    }

    function create_container(name, config, d) {
        if (d === undefined) { d = document; }
        var container = d.createElement('div');
        container.id = name;
        container.className = 'chitikaAdContainer';
        set_properties(container.style, {
            'backgroundColor'   : def(config.bgColor, '#FFFFFF'),
            'border'            : def(config.border, 'none'),
            'borderRadius'      : def(config.borderRadius, 'none'),
            'boxShadow'         : def(config.boxShadow, 'none'),
            'padding'           : def(config.padding, 'none'),
            'position'          :'fixed',
            'zIndex'            : '99999'
        });
        if (config.close_handler) {
            CHITIKA_ADS.attach_close(
                container,
                {
                    style       : {
                        'background': config.close_image,
                        'height'    : config.close_height,
                        'right'     : config.close_right,
                        'top'       : config.close_top,
                        'width'     : config.close_width
                    }
                },
                config.close_handler,
                d
            );
        }
        return container;
    }

    ////////////////////////////////////////////////////////////////
    // Shorthand for creating an iframe element.
    function create_iframe(name, width, height, d) {
        if (d === undefined) { d = document; }

        var properties = {
            'allowTransparency' : 'allowTransparency',
            'border'            : '0',
            'className'         : 'chitikaAdBlock',
            'frameBorder'       : '0',
            'height'            : (typeof(height) === 'string' ? 0 : height),
            'hspace'            : '0',
            'id'                : name,
            'marginHeight'      : '0',
            'marginWidth'       : '0',
            'padding'           : '0',
            'scrolling'         : 'no',
            'src'               : 'about:blank',
            'style'             : {
                'margin'        : '0',
                'padding'       : '0'
            },
            'vspace'            : '0',
            'width'             : (typeof(width) === 'string' ? 0 : width)
        };

        var frame = d.createElement('iframe');
        set_properties(frame, properties);
        return frame;
    }

    function create_spinner(d, id, properties, spinner_url) {
        if (!spinner_url) { spinner_url = 'http://images.chitika.net/spinner.gif'; }
        var container = d.createElement('div');
        container.id = id;
        set_properties(container, properties);
        var spinner = d.createElement('img');
        spinner.src = spinner_url;
        spinner.style.margin = 'auto';
        spinner.style.display = 'block';
        container.appendChild(spinner);
        return container;
    }

    // def() - If defined, return v, else return def(ault)
    function def(v, def) {
        if (v !== null && v !== undefined) {
            return v;
        }
        else {
            return def;
        }
    }

    // dq() - Return input surrounded by double-quotes
    function dq(s) { return (s !== null) ? '"' + s + '"' : '""'; }

    function get_screen_size() {
        if (size_screen !== undefined) { return size_screen; }
        size_screen = {
            h: screen.height,
            w: screen.width
        }
        return size_screen;
    }

    function get_scroll_size() {
        if (size_scroll !== undefined) { return size_scroll; }
        var d = window_data.top_accessible ? top.document : window.document;
        size_scroll = {
            h: d.documentElement.scrollHeight ||
               d.body.scrollHeight,
            w: d.documentElement.scrollWidth ||
               d.body.scrollWidth
        }
        return size_scroll;
    }

    // get_snippet_data - Gathers snippets of text from the page which can
    // be used for targeting.
    function get_snippet_data() {
        if (snippet_cache) { return snippet_cache; }
        snippet_cache = {};

        // 1. Decide which document scope to search.
        var d = window_data.top_accessible ? top.document : window.document;

        // 2. Meta tags. Get them all.
        var meta = d.getElementsByTagName('meta');
        for (var i = 0; i < meta.length; i++) {
            var name    = meta[i].getAttribute('name'),
                content = meta[i].getAttribute('content');

            if (name && content) {
                snippet_cache[name.toLowerCase()] = content;
            }
        }

        // 3. Look up any of our "priorities" by tag name.
        for (var c = 0; c < CHITIKA.snippet_priority.length; c++) {
            var m = CHITIKA.snippet_priority[c].match(/^([^\/]+)(?:\/(\d+))?/);
            var i = (m[2] ? parseInt(m[2]) : 0);
            var tags = d.getElementsByTagName(m[1]);
            if (tags.length <= i ) { continue; }
            snippet_cache[m[1]] = tags[i].textContent || tags[i].innerText;
        }

        // 4. Return it.
        return snippet_cache;
    }

    function get_url_data() {
        if (url_data_cache !== undefined) { return url_data_cache; }
        var frm, ref, serveUrl, url;
        // Detect iframes and pass appropriate frm & url values
        if (window_data.top_same) {
            ref             = document.referrer;
            url             = document.location.href;
        } else if (window_data.top_accessible) {
            frm             = 1;
            ref             = top.document.referrer;
            url             = top.document.location.href;
            serveUrl        = document.location.href;
        } else {
            // Security exception.
            frm             = 2;
            url             = document.referrer;
            serveUrl        = document.location.href;
        }

        if (serveUrl &&
            serveUrl.match(/^javascript:/)) {
            serveUrl = undefined;
        }
        url_data_cache = {
            frm         : frm,
            ref         : ref,
            serveUrl    : serveUrl,
            url         : url
        };
        return url_data_cache;
    }

    function get_viewport_size() {
        if (size_viewport !== undefined) { return size_viewport; }
        var w = window_data.top_accessible ? top : window;
        size_viewport = {
            h   : w.innerHeight ||
                  w.document.documentElement.clientHeight ||
                  w.document.body.clientHeight,
            w   : w.innerWidth ||
                  w.document.documentElement.clientWidth ||
                  w.document.body.clientWidth
        };
        return size_viewport;
    }

    // If the window is resized, the ad unit my re-flow. We need to adjust
    // the height automatically if this happens.
    function handle_resize() {
        // Dirty our viewport size cache.
        size_viewport = undefined;
        // Reflow units and recalc size.
        for (var unit_id = 0; unit_id < CHITIKA.units.length; unit_id++) {
            var unit = CHITIKA.units[unit_id];
            if (!unit.already_rendered) { continue; }
            if (unit.fluidH) {
                for (var c = 0; c < unit.frames.length; c++) {
                    var frame = unit.frames[c];
                    if (!frame ||
                        !frame.contentWindow ||
                        !frame.contentWindow.document) {
                        continue;
                    }
                    var h1 = frame.contentWindow.document.documentElement.scrollHeight ||
                             frame.contentWindow.document.body.scrollHeight;
                    var h2 = unit.height;
                    if (h1 != h2) {
                        unit.height = h1;
                        frame.style.height = h1 + "px";
                    }
                }
            }
            if (window_data.top_accessible &&
                !unit.already_visible &&
                !unit.disable_vcpm) {
                unit.loc = locate_obj(unit.container);
            }
        }
        if (lightbox_container &&
            lightbox_container.style.display == 'block') {
            lightbox_show();
        }
    }

    // ldef() - Return the first argument that isn't undefined
    function ldef() {
        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i] !== undefined) {
                return arguments[i];
            }
        }
        return undefined;
    }

    function lightbox(impId, index, query) {
        var metadata = {
            'hc1'           : query,
            'lc1'           : index
        };
        send_event('lightbox_click', impId, metadata);

        if (!window_data.top_accessible) { return; }

        // 1: Intercept our config.
        var lightbox_config = CHITIKA_ADS.lightbox_config;

        // 2: Make sure we know how big the unit will be.
        if (!lightbox_config.height || !lightbox_config.width) {
            var l = ['height', 'width'];
            var viewport_size_data = get_viewport_size();
            for (var c = 0; c < 2; c++) {
                var k = l[c];
                if (lightbox_config[k]) { continue; }
                lightbox_config[k] = Math.floor(viewport_size_data[(k == 'width' ? 'w' : 'h')] * lightbox_config[k+'_percent']);
                if (lightbox_config[k] > lightbox_config[k+'_max']) {
                    lightbox_config[k] = lightbox_config[k+'_max'];
                } else if (lightbox_config[k] < lightbox_config[k+'_min']) {
                    lightbox_config[k] = lightbox_config[k+'_min'];
                }
            }
        }

        // 3: Make sure we have a units reference.
        if (top.lightbox_units === undefined) { top.lightbox_units = {}; }
        var lightbox_units = top.lightbox_units;

        // 4: Find out modal mask, and make new stuff if not found.
        lightbox_modal = top.document.getElementById('chitika-modal');
        if (lightbox_modal === null) {
            lightbox_modal = top.document.createElement('div');
            lightbox_modal.id = 'chitika-modal';
            set_properties(lightbox_modal.style, {
                'allowTransparency' : 'allowTransparency',
                'backgroundColor'   : lightbox_config.modal_color,
                'bottom'            : '0',
                'display'           : 'none',
                'filter'            : 'alpha(opacity='+lightbox_config.modal_opacity*100+')',
                'left'              : '0',
                'opacity'           : lightbox_config.modal_opacity,
                'position'          : 'fixed',
                'right'             : '0',
                'top'               : '0',
                'zIndex'            : '9999',
                'zoom'              : '1'
            });
            append_func(lightbox_modal, 'click', lightbox_hide);
            top.document.body.appendChild(lightbox_modal);

            lightbox_container = create_container('chitika-container-lightbox', lightbox_config, top.document);
            lightbox_container.style.margin = 'auto auto';
            top.document.body.appendChild(lightbox_container);
            lightbox_container.appendChild(create_spinner(top.document,
                                                          'chitika-spinner-lightbox',
                                                          undefined,
                                                          lightbox_config.spinner_url));
        }

        lightbox_container = top.document.getElementById('chitika-container-lightbox');
        if (lightbox_units[impId] === undefined) { lightbox_units[impId] = {}; }

        // 5: Make an ad call, or use a cached ad.
        if (lightbox_units[impId][index] === undefined) {
            top.document.getElementById('chitika-spinner-lightbox').style.display = 'block';
            var frame_name = 'chitikaLightbox-'+impId + '-' + index;
            var frame = create_iframe(frame_name, lightbox_config.width, lightbox_config.height, top.document);
            lightbox_container.appendChild(frame);

            var unit = {
                'cid'               : lightbox_config.cid,
                'container'         : lightbox_container,
                'disable_vcpm'      : true,
                'frames'            : [ frame ],
                'height'            : lightbox_config.height,
                'impId'             : impId,
                'product'           : 'lightbox',
                'query'             : query,
                'sid'               : lightbox_config.sid,
                'width'             : lightbox_config.width
            };
            lightbox_units[impId][index] = unit;
            write_empty_document(frame.contentWindow.document);
            frame.contentWindow.render_ad = lightbox_callback;
            CHITIKA.units.push(unit);
            prepare_instructions();
            prepare_ad_urls();
            make_ad_server_call();
        } else {
            lightbox_units[impId][index].frames[0].style.display = 'block';
        }
        lightbox_show();
    }

    function lightbox_callback(response) {
        if (response === undefined ||
            (!response.output &&
             !response.alturl)) {
            lightbox_hide();
        }
        var unit = CHITIKA.units[response.unit_id];
        var frame = unit.frames[0];

        top.document.getElementById('chitika-spinner-lightbox').style.display = 'none';
        render_ad_basic(response);
        render_ad_inject_content(response);
        frame.style.display = 'block';
    }

    function lightbox_show() {
        var lightbox_config = CHITIKA_ADS.lightbox_config;
        var viewport_size_data = get_viewport_size();
        var boxOffsetLeft = (viewport_size_data.w - lightbox_config.width)/2;
        var boxOffsetTop = (viewport_size_data.h - lightbox_config.height)/2;

        lightbox_container.style.left = boxOffsetLeft+'px',
        lightbox_container.style.top = boxOffsetTop+'px',
        lightbox_container.style.display = 'block';
        lightbox_modal.style.display = 'block';
    }

    function lightbox_hide() {
        for (var k in top.lightbox_units) {
            for (var j in top.lightbox_units[k]) {
                top.lightbox_units[k][j].frames[0].style.display = 'none';
            }
        }
        lightbox_container.style.display = 'none';
        lightbox_modal.style.display = 'none';
        return false;
    }

    // locate_obj() - walks the DOM tree from obj, accumulating offset left
    // and top to find X, Y position for obj
    function locate_obj(obj) {
        var _x = 0;
        var _y = 0;
        var _w = 0;
        var _h = 0;
        _w = obj.offsetWidth;
        _h = obj.offsetHeight;
        while (obj) {
            _x += obj.offsetLeft;
            _y += obj.offsetTop;
            if (obj.tagName == 'BODY') {
                var w = obj.ownerDocument.defaultView ||
                        obj.ownerDocument.parentWindow;
                obj = w.frameElement;
            } else {
                obj = obj.offsetParent;
            }
        }
        return { x: _x, y: _y, w: _w, h: _h };
    }

    function make_ad_server_call() {
        var base_url = CHITIKA.proto + '://' + CHITIKA.host + '/minimall';
        for (var unit_id = 0; unit_id < CHITIKA.units.length; unit_id++) {
            var unit            = CHITIKA.units[unit_id];
            var container       = unit.container;
            var frame           = unit.frames[0];
            var url             = base_url;
            // Don't call for units that are already done or not ready yet.
            if (unit.already_fired || !unit.ad_url_params || !frame) { continue; }
            unit.already_fired = true;

            if (unit.force_rtb ||
                (!unit.disable_rtb &&
                 (unit.cpm_floor || Math.random() < 0))) {
                url = 'http://rtbid.chitika.net/chitika/decision';
            }

            var url = url + unit.ad_url_params;
            add_script(url, frame.contentWindow.document);
        }
    }

    function make_it_so() {
        for (var c = 0; c < CHITIKA.units.length; c++) {
            if (CHITIKA.units[c].impId) { continue; }
            CHITIKA.units[c].impId = def(CHITIKA.impId, uuid());
            if (debug_pixels && c == 0) {
                send_event('mmu0_initial', CHITIKA.units[c].impId, {
                    'hc1'       : (new Date() - time_start)
                });
            }
        }
        prepare_instructions();
        prepare_containers();
        prepare_ad_urls();
        make_ad_server_call();
    }

    function mobile_type() {
        if (mobile !== undefined) { return mobile; }
        if (/i[Pp]ad/.test(navigator.userAgent)) {
            mobile = 1;
        }
        else if (/i[Pp]od/.test(navigator.userAgent)) {
            mobile = 4;
        }
        else if (/i[Pp]hone/.test(navigator.userAgent)) {
            mobile = 2;
        }
        else if (/[Aa]ndroid/.test(navigator.userAgent)) {
            mobile = 3;
        }
        else if (/BlackBerry|RIM/.test(navigator.userAgent)) {
            mobile = 5;
        }
        else {
            mobile = 0;
        }
        return mobile;
    }

    function param_concat(url, p, v) {
        if (!v && v !== 0) { return url; }
        return url + '&' + p + '=' + v;
    }

    function param_concat_escape(url, p, v) {
        if (!v && v !== 0) { return url; }
        return url + '&' + p + '=' + encodeURIComponent(v);
    }

    function param_concat_words(url, p, v) {
        if (!v && v !== 0) { return url; }
        v = v.replace(/[\W]+/, '_');
        return url + '&' + p + '=' + encodeURIComponent(v);
    }

    function prepare_ad_urls() {
        var screen_size_data    = get_screen_size(),
            scroll_size_data    = get_scroll_size(),
            snippet_data        = get_snippet_data(),
            url_data            = get_url_data(),
            viewport_size_data  = get_viewport_size();

        for (var unit_id = 0; unit_id < CHITIKA.units.length; unit_id++) {
            var unit            = CHITIKA.units[unit_id];
            var container       = unit.container;
            // Don't call for units that are already done or not ready yet.
            if (unit.ad_url_params || !container) { continue; }

            // 3.1: Initial URI for ad request.
            var ad_url = '?output='+ unit.output;

            // 3.2: Critical identification properties.
            ad_url = param_concat_escape(ad_url, 'publisher',           unit.publisher);
            ad_url = param_concat_escape(ad_url, 'sid',                 unit.sid);
            ad_url = param_concat_escape(ad_url, 'altsid',              unit.altsid);
            ad_url = param_concat_words(ad_url, 'cid',                  unit.cid);
            ad_url = param_concat(ad_url, 'unit_id',                    unit_id);
            ad_url = param_concat_escape(ad_url, 'product',             unit.product);
            ad_url = param_concat_escape(ad_url, 'w',                   unit.width);
            ad_url = param_concat_escape(ad_url, 'h',                   unit.height);
            ad_url = param_concat_escape(ad_url, 'nump',                unit.nump);
            ad_url = param_concat_escape(ad_url, 'impId',               unit.impId);
            ad_url = param_concat_escape(ad_url, 'extra_subid_info',    unit.extra_subid_info);
            ad_url = param_concat_escape(ad_url, 'cpm_floor',           unit.cpm_floor);

            // 3.3: Info about where we are on the internet.
            for (var k in url_data) {
                var v = url_data[k];
                var v2;
                if (unit.omg !== undefined) {
                    v2 = unit.omg[k];
                    if (v2 && v2 != v) {
                        ad_url = param_concat(ad_url, 'omg_'+k, 1);
                        v = v2;
                    }
                }
                ad_url = param_concat_escape(ad_url, k, v);
            }

            // 3.4: Some publisher settings.
            ad_url = param_concat_escape(ad_url, 'altcss',              unit.alternate_css_url);
            ad_url = param_concat_escape(ad_url, 'alturl',              unit.alternate_ad_url);
            ad_url = param_concat_escape(ad_url, 'cttarget',            unit.target);
            ad_url = param_concat_escape(ad_url, 'tptracker',           unit.third_party_tracker);

            // 3.5: Targetting data.
            ad_url = param_concat_escape(ad_url, 'query',               unit.query);
            ad_url = param_concat_escape(ad_url, 'where',               unit.where);
            ad_url = param_concat_escape(ad_url, 'city',                unit.city);
            ad_url = param_concat_escape(ad_url, 'state',               unit.state);
            ad_url = param_concat_escape(ad_url, 'zip',                 unit.zip);
            if (unit.queries &&
                unit.queries.constructor.toString().indexOf("Array") !== -1) {
                ad_url = param_concat_escape(ad_url, 'mquery', unit.queries.join('|'));
            }

            // 3.6: Visual configuration properties.
            ad_url = param_concat_escape(ad_url, 'cl_border',           unit.color_border);
            ad_url = param_concat_escape(ad_url, 'cl_bg',               unit.color_bg);
            ad_url = param_concat_escape(ad_url, 'cl_title',            unit.color_title);
            ad_url = param_concat_escape(ad_url, 'cl_text',             unit.color_text);
            ad_url = param_concat_escape(ad_url, 'cl_site_link',        unit.color_site_link);
            ad_url = param_concat_escape(ad_url, 'fn_title',            unit.font_title);
            ad_url = param_concat_escape(ad_url, 'fn_text',             unit.font_text);

            // 3.7: Data attributes.
            ad_url = param_concat(ad_url, 'dpr',                        window.devicePixelRatio);
            ad_url = param_concat_escape(ad_url, 'impsrc',              unit.impsrc);
            ad_url = param_concat_escape(ad_url, 'history',             history.length);
            ad_url = param_concat_escape(ad_url, 'size_screen',         screen_size_data.w+'x'+screen_size_data.h);
            ad_url = param_concat_escape(ad_url, 'size_scroll',         scroll_size_data.w+'x'+scroll_size_data.h);
            ad_url = param_concat_escape(ad_url, 'size_viewport',       viewport_size_data.w+'x'+viewport_size_data.h);
            ad_url = param_concat_escape(ad_url, 'vsn',                 version);
            if (jq) { ad_url = param_concat_escape(ad_url, 'jquery', jq.fn.jquery); }
            if (window_data.top_accessible &&
                top.document.compatMode != 'CSS1Compat') {
                ad_url = param_concat(ad_url, 'quirks', 1);
            }

            // 3.8 Anything extra.
            if (unit.extra_params !== undefined) {
                for (var k in unit.extra_params) {
                    ad_url = param_concat_escape(ad_url, k, unit.extra_params[k]);
                }
            }

            // 3.9: Indicate Chrome prerendering mode.
            if (navigator.userAgent.match(/Chrome/) &&
                document.webkitVisibilityState !== undefined &&
                document.webkitVisibilityState == "prerender") {
                ad_url = param_concat(ad_url, 'prerender', 1);
            }

            // 3.10: Include some targetting data from the local page.
            var count = 0;
            for (var c = 0; c < CHITIKA.snippet_priority.length && count < CHITIKA.snippet_count; c++) {
                var id = CHITIKA.snippet_priority[c].match(/^([^\/]+)(?:\/(\d+))?/)[1];
                if (snippet_data[id]) {
                    ad_url = param_concat_escape(ad_url, 'snip_' + id, snippet_data[id].substring(0, CHITIKA.snippet_length));
                    ++count;
                }
            }

            if (window_data.top_accessible) {
                unit.loc = locate_obj(container);
                ad_url = param_concat(ad_url, "x", unit.loc.x);
                ad_url = param_concat(ad_url, "y", unit.loc.y);
            }

            ad_url = ad_url.substring(0, 2048);       // Trim request URL to 2048 characters
            ad_url = ad_url.replace(/%\w?$/, '');     // Remove any trailing malformed URL encoded character

            if (unit.adurl_fixup !== undefined) {
                ad_url = unit.adurl_fixup(ad_url);
            }
            unit.ad_url_params = ad_url;
        }
    }

    function prepare_containers() {
        for (var unit_id = 0; unit_id < CHITIKA.units.length; unit_id++) {
            var unit        = CHITIKA.units[unit_id];
            if (unit.container) { continue; }

            for (var c = 0; c <= unit.hasClones; c++) {
                // 1: Generate names for stuff.
                var container_name = 'chitikaAdBlock-' + unit_id;
                if (c != 0) { container_name += '-' + c; }
                var frame_name  = "ch_ad" + unit_id + '-' + c;

                // 2: Locate the container, save ref to the first one.
                var container  = document.getElementById(container_name);
                if (!container) { continue; }
                if (c == 0) { unit.container = container; }

                // 3: Apply class name for easy identification
                if (!container.className) {
                    container.className = "chitikaAdContainer";
                } else if (container.className.indexOf("chitikaAdContainer") == -1) {
                    container.className += " chitikaAdContainer";
                }

                // 4: Append a fresh iframe to each container.
                var frame = create_iframe(frame_name, unit.width, unit.height);
                container.appendChild(frame);
                if (c == 0) { write_empty_document(frame.contentWindow.document); }
                frame.contentWindow.render_ad = create_callback(unit_id);
                frame.contentWindow.CHITIKA = CHITIKA;
                frame.contentWindow.CHITIKA_ADS = CHITIKA_ADS;
                unit.frames.push(frame);
            }
        }
    }

    function prepare_instructions() {
        for (var unit_id = 0; unit_id < CHITIKA.units.length; unit_id++) {
            var unit = CHITIKA.units[unit_id];
            if (unit.already_fired) { continue; }

            // 1: s/client/publisher/. Imposed vocabulary correction.
            if (unit.client) {
                unit.publisher = unit.client;
                delete unit.client;
            }

            // 2: Save a reference to the publisher name. Sometimes needed
            //    for Apps later
            CHITIKA.publisher = def(CHITIKA.publisher, unit.publisher);
            if (!unit.publisher) { unit.publisher = CHITIKA.publisher; }

            // 3: Make sure we have a CID for automated identification.
            if (!unit.cid) {
                if (!unit.sid ||
                    unit.sid == 'Chitika Default') {
                    unit.cid = 'unit-'+unit_id;
                }
                else {
                    unit.cid = unit.sid;
                }
            }

            // 4: Make sure we identify the traffic generator.
            unit.impsrc = def(unit.impsrc, "getads");

            // 5: Remove default parameter values. They waste log space.
            for (var p in default_params) {
                var c = default_params[p];
                if (!unit[p]) { continue; }
                if (unit[p].match(new RegExp(c, "i"))) { delete unit[p]; }
            }

            // 6: Publisher only gets to ask for a number of ads in h=auto mode.
            if (!unit.fluidH &&
                unit.nump) {
                delete unit.nump;
            }

            // 7: Make sure there are at least 0 clones, init the frames array.
            unit.frames = def(unit.frames, []);
            unit.hasClones = def(unit.hasClones, 0);

            // 8: Ensure there's an output type defined.
            unit.output = def(unit.output, 'jsonp');

            // 9: For the regretable past...
            if (unit.publisher == 'yellowbook' &&
                w.ch_hq == 1) {
                var tmp = document.getElementById('related-categories');
                if (tmp) { tmp = tmp.getElementsByTagName('a'); }
                if (tmp) { tmp = tmp[0].innerHTML; }
                unit.query = tmp;
            }
        }
    }

    function render_ad_basic(response) {
        var unit_id = response.unit_id;
        var unit = CHITIKA.units[unit_id];

        if (response.alturl) {
            unit.alternate_ad_url = response.alturl;
        }

        if (response.disable_vcpm) {
            unit.disable_vcpm = true;
        }

        if (response.fluidH) {
            unit.fluidH = true;
        }

        unit.impId = response.impId;
        unit.navajo = response.navajo;
    }

    function render_ad_inject_content(response) {
        var unit_id = response.unit_id;
        var unit = CHITIKA.units[unit_id];
        var container = unit.container;
        var steal_jquery = !response.no_steal_jquery;

        for (var c = 0; c < unit.frames.length; c++) {
            var frame = unit.frames[c];
            var w = frame.contentWindow;
            if (response.output) {
                // Share some magic with our iframe children.
                sharing_is_caring(frame, steal_jquery);
                var f = w.render_ad;

                try {
                    w.document.open();
                    w.document.write(response.output);
                    if (!response.dont_close) {
                        w.document.close();
                    } else {
                        setTimeout(function() {
                            try { w.document.close(); } catch (e) {}
                        }, 5000);
                    }
                } catch (e) {
                    // Fallback method of writing into an iframe.
                    w.document.innerHTML = response.output;
                }
                unit.already_rendered = true;

                // Dear MSIE10: please stop being a jerk. Love, Martin.
                sharing_is_caring(frame, steal_jquery);
                // Copy back our render_ad function, just in case...
                w.render_ad = f;
                if (!unit.disable_vcpm) { visibility_check(); }
            } else if (unit.alternate_ad_url) {
                frame.src = unit.alternate_ad_url;
                frame.style.height = 'auto';
                unit.disable_vcpm = false;
            } else if (response.altjs) {
                unit.disable_vcpm = false;
                frame.style.height = 'auto';
                add_script(response.altjs, w.document);
            } else {
                frame.style.display = 'none';
                w.document.close();
                unit.disable_vcpm = false;
            }
        }
    }

    function render_ad_js(response) {
        if (!response.js) { return; }
        var d = window_data.top_accessible ? top.document : window.document;
        for (var i = 0; i < response.js.length; i++) {
            var url = response.js[i];
            add_script(url, d);
        }
    }

    function render_ad_pixels(response) {
        if (!response.pixels) { return; }
        for (var i = 0; i < response.pixels.length; i++) {
            var url = response.pixels[i];
            var fimg = document.createElement("img");
            fimg.border = 0;
            fimg.style.border = 'none';
            fimg.style.display = 'none';
            fimg.width = 1;
            fimg.height = 1;
            fimg.src = url;
            document.body.appendChild(fimg);
        }
    }

    function send_event(event_name, impId, metadata) {
        var url_data = get_url_data();
        var url = 'http://mm.chitika.net/chewey?event='+event_name;
        url = param_concat_escape(url, 'publisher', CHITIKA.publisher);
        url = param_concat_escape(url, 'impId', impId);
        url = param_concat_escape(url, 'url', url_data.url);
        if (metadata) {
            for (var k in metadata) {
                var v = metadata[k];
                url = param_concat_escape(url, k, v);
            }
        }
        var pixel = new Image(1, 1);
        pixel.src = url;
        pixel.style.display = 'none';
    }

    // Define a function for setting iframe attributes from a hash. Needs to function
    // recursively for properties like style.
    function set_properties(o, p) {
        for (var k in p) {
            var v = p[k];
            if (v === undefined) { continue; }
            if (typeof v === 'function') { continue; }
            if (typeof v === 'object') {
                set_properties(o[k], v);
            } else {
                o[k] = v;
            }
        }
    }

    function sharing_is_caring(frame, steal_jquery) {
        var w = frame.contentWindow;

        w.CHITIKA = CHITIKA;
        w.CHITIKA_ADS = CHITIKA_ADS;
        w.lightbox = lightbox;
        w.lightbox_config = CHITIKA_ADS.lightbox_config;

        var m;
        if (jq) { m = jq.fn.jquery.match(/^1\.(\d*)/); }

        if (steal_jquery &&
            m &&
            parseInt(m[1]) >= 4) {
            var fun = function(selector, context) {
                if (!context) { context = w.document; }
                return jq(selector, context);
            }
            w['$'] = fun;
            w['jQuery'] = fun;
        }
    }

    function uuid() {
        var uuid = "", i, random;
        for (i = 0; i < 32; i++) {
            random = Math.random() * 16 | 0;
            uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
        }
        return uuid;
    }

    function visibility_check() {
        if (!window_data.top_accessible) { return; }
        var offset_h = document.documentElement.scrollTop ||
                       document.body.scrollTop;
        var viewport_size_data = get_viewport_size();
        for (var c = 0; c < CHITIKA.units.length; c++) {
            var unit = CHITIKA.units[c];
            // 1: Get info about where we are and where the unit is.
            if (!unit.already_rendered ||
                unit.already_visible ||
                unit.disable_vcpm) {
                continue;
            }
            var h = unit.height;
            var y = unit['loc']['y'];

            // 2: Skip if we're not 50% in that visible area.
            if (y < (offset_h - (0.5*h)) ||
                y > (offset_h + viewport_size_data['h'] - (0.5*h))) {
                continue;
            }

            // 3: Send event.
            var metadata = {
                'unit_id'       : c,
                'h'             : h,
                'offset_h'      : offset_h,
                'sid'           : unit.sid,
                'viewport_h'    : viewport_size_data.h,
                'viewport_w'    : viewport_size_data.w,
                'xargs'         : unit.navajo,
                'w'             : unit.width,
                'y'             : y
            };
            send_event('imp_visible', unit['impId'], metadata);

            // 4: Mark as already visible.
            unit['already_visible'] = true;
        }
    }

    function write_empty_document(d) {
        // We need to write an empty document into our iframe, else
        // you won't be able to inject a <script> into its head. Only
        // a problem with certain ::cough MSIE:: browsers.
        // NOTE: The contentWindow doesn't exist until the object is in
        //       the DOM.
        d.write('<!DOCTYPE html><html><head></head><body></body></html>');
    }

    append_func(window_data.top_accessible ? top : window, 'resize', handle_resize);

    if (window_data.top_accessible) {
        append_func(top, 'scroll', visibility_check);
    }

    return {
        'add_script'                : add_script,
        'already_bridged'           : already_bridged,
        'animate'                   : animate,
        'append_func'               : append_func,
        'attach_close'              : attach_close,
        'bridge_amm'                : bridge_amm,
        'create_container'          : create_container,
        'create_iframe'             : create_iframe,
        'create_spinner'            : create_spinner,
        'def'                       : def,
        'dq'                        : dq,
        'drop_it_like_its_hot'      : drop_it_like_its_hot,
        'get_screen_size'           : get_screen_size,
        'get_scroll_size'           : get_scroll_size,
        'get_snippet_data'          : get_snippet_data,
        'get_url_data'              : get_url_data,
        'get_viewport_size'         : get_viewport_size,
        'ldef'                      : ldef,
        'lightbox_config'           : lightbox_config_internal,
        'locate_obj'                : locate_obj,
        'make_ad_server_call'       : make_ad_server_call,
        'make_it_so'                : make_it_so,
        'mobile_type'               : mobile_type,
        'param_concat_escape'       : param_concat_escape,
        'param_concat'              : param_concat,
        'param_concat_words'        : param_concat_words,
        'prepare_ad_urls'           : prepare_ad_urls,
        'render_ad_basic'           : render_ad_basic,
        'render_ad_inject_content'  : render_ad_inject_content,
        'send_event'                : send_event,
        'set_properties'            : set_properties,
        'uuid'                      : uuid,
        'window_data'               : window_data,
        'write_empty_document'      : write_empty_document
    };
}());

if (CHITIKA_ADS.window_data.top_accessible &&
    !top.CHITIKA) {
    top.CHITIKA = CHITIKA;
    top.CHITIKA_ADS = CHITIKA_ADS;
}

CHITIKA.host                = CHITIKA_ADS.def(CHITIKA.host, 'mm.chitika.net');
CHITIKA.proto               = CHITIKA_ADS.def(CHITIKA.proto, 'http');
CHITIKA.publisher           = CHITIKA_ADS.def(CHITIKA.publisher, undefined);
CHITIKA.snippet_count       = CHITIKA_ADS.def(CHITIKA.snippet_count, 1);
CHITIKA.snippet_length      = CHITIKA_ADS.def(CHITIKA.snippet_length, 100);
CHITIKA.snippet_priority    = CHITIKA_ADS.def(CHITIKA.snippet_priority, ['title', 'h1', 'keywords', 'description']);
CHITIKA.units               = CHITIKA_ADS.def(CHITIKA.units, []);

if (window.chitika_units !== undefined) {
    for (var c = 0; c < window.chitika_units.length; c++) {
        var unit = window.chitika_units[c];
        if (!unit) { continue; }
        CHITIKA.units.push(unit);
        window.chitika_units[c] = null;
    }
}

// Schedule execution.
CHITIKA_ADS.bridge_amm();
if (!CHITIKA_ADS.already_bridged) {
    CHITIKA_ADS.already_bridged = true;
    CHITIKA_ADS.append_func(window, 'load', CHITIKA_ADS.make_it_so);
    // Trigger a few times to deal with slow DOM rendering.
    setTimeout(CHITIKA_ADS.make_it_so, 1000);
    setTimeout(CHITIKA_ADS.make_it_so, 2000);
    setTimeout(CHITIKA_ADS.make_it_so, 4000);
    setTimeout(CHITIKA_ADS.make_it_so, 8000);
}