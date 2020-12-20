(function() {
    var c = function(a) {
        a = document.getElementsByClassName(a);
        for (var b = a.length; a[0];) a[0].parentNode.removeChild(a[0]);
        return b
    };
    if (0 < c("g4n7t")) c("g4nt7");
    else {
        var f = function(a, b, d) {
                a = document.createElement(a);
                for (key in b) a.setAttribute(key, b[key]);
                a.setAttribute("class", "g4n7t");
                a.onload = d;
                a.onreadystatechange = function() {
                    "complete" == this.readyState && d()
                };
                document.body.appendChild(a)
            },
            e = function(a, b) {
                if (0 < a.length) {
                    var d = a.shift(),
                        c;
                    for (c in d) {
                        var g = d[c];
                        switch (c) {
                            case "js":
                                f("script", {
                                    type: "text/javascript",
                                    src: g
                                }, function() {
                                    e(a, b)
                                });
                                break;
                            case "css":
                                f("link", {
                                    rel: "stylesheet",
                                    href: g
                                }, function() {
                                    e(a, b)
                                })
                        }
                    }
                } else b()
            };
        e([{
            js: AJS.contextPath() + "/download/resources/mraddon.hvqzao.jgantt:jgantt-static/data/zepto.min.js"
        }, {
            css: AJS.contextPath() + "/download/resources/mraddon.hvqzao.jgantt:jgantt-static/data/loading.css"
        }], function() {
            Zepto(function(a) {
                a('<div style="position:absolute;top:50%;left:50%;margin-left:-36px;margin-top:-36px;z-index:20" class="g4n77 cssload-thecube"><div class="cssload-cube cssload-c1"></div><div class="cssload-cube cssload-c2"></div><div class="cssload-cube cssload-c4"></div><div class="cssload-cube cssload-c3"></div></div>').appendTo("body")
            });
            let resourcesToLoad = [
                {js:  AJS.contextPath() + "/download/resources/mraddon.hvqzao.jgantt:jgantt-static/data/dhtmlxgantt.js"},
                {css: AJS.contextPath() + "/download/resources/mraddon.hvqzao.jgantt:jgantt-static/data/dhtmlxgantt.css"},
                {css: AJS.contextPath() + "/download/resources/mraddon.hvqzao.jgantt:jgantt-static/data/style.css"},
                {js:  AJS.contextPath() + "/download/resources/mraddon.hvqzao.jgantt:jgantt-static/data/jira-rest-calls.js"},
                {js:  AJS.contextPath() + "/download/resources/mraddon.hvqzao.jgantt:jgantt-static/data/logic.js"},
                {js:  AJS.contextPath() + "/download/resources/mraddon.hvqzao.jgantt:jgantt-static/data/gantt-api.js"},
            ]
            e(resourcesToLoad, function() {
                c("g4nt7")
            })
        })
    }
})();