
let Util = function () {
    let createPieChart = function (data, id, template) {
        let options = JSON.parse(JSON.stringify(template));
        options.series[0].data = data;
        return Highcharts.chart(id, options);
    },
        // createChart = function (x, y, label_name, container, template) {

        //     let options = $.extend({}, template, {
        //         series: [{
        //             name: label_name,
        //             data: y
        //         }],


        //     });
        //     if (x) {
        //         $.extend(options, {
        //             xaxis: {
        //                 categories: x
        //             }
        //         });
        //     }
        //     var chart = new ApexCharts(container, options);

        //     chart.render();
        // },
        generateDate = function (mm) {
            return new Date(mm).toLocaleDateString();
        },
        generateFullDate = function (mm) {
            let date = new Date(mm);
            return date.toLocaleString("en-US", { timeZoneName: "short" });
        },
        msToString = function (ms) {
            let seconds = parseInt(ms / 1000);
            let minutes = parseInt(seconds / 60);
            let hours = parseInt(minutes / 60);
            minutes %= 60;
            seconds %= 60;

            minutes = ("00" + minutes).slice(-2);
            seconds = ("00" + seconds).slice(-2);

            if (hours == 0) {
                return "Speaking time: " + minutes + ":" + seconds;
            } else {
                return "Speaking time: " + hours + ":" + minutes + ":" + seconds;
            }
        },
        getVersion = function (callback) {
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.open('GET', '../manifest.json');
            xmlhttp.onload = function () {
                var manifest = JSON.parse(xmlhttp.responseText);
                callback(manifest.version);
            }
            xmlhttp.send(null);
        },
        msToMin = function (ms) {
            return Math.round(ms / 60 / 100) / 10;
        },
        createFullPage = function (url, $win) {
            return new Promise((re) => {
                let frame = document.createElement("iframe");
                frame.setAttribute("src", url);
                frame.classList.add("full-page");
                frame.classList.add("hidden"); //Otherwise the page is visible for a split second before the css loads

                $(frame).appendTo($win).on('load', (ev) => {
                    // console.log(ev.currentTarget);

                    let $frame = $(ev.currentTarget);

                    if ($frame.closest(".page").length > 0) {
                        let $script = $(createCSSLink("style.css"));
                        $script[0].onload = function () {
                            transitionToNewPage($frame).then(() => re($frame));
                        };
                        $frame.contents().find("html").attr("ref",$win.attr("ref"));
                        $script.appendTo($frame.contents().find("head"));
                    } else {

                        let div = document.createElement("div");
                        div.classList.add("page");
                        $frame.wrap(div);
                    }

                });
            });



        },
        transitionToNewPage = function ($frame) {
            return new Promise((re) => {
                let prev_page = $frame.parent().parent().find(".page.active");
                let lev = parseInt(prev_page.attr("lev"));
                prev_page.removeClass("active").addClass("below");
                $frame.removeClass("hidden");
                $frame.closest(".page").addClass("active").attr("lev", lev + 1);
                showBackArrow();
                re($frame);
            });

        },
        goToPrevPage = function ($page) {
            let lev = parseInt($page.attr("lev")) - 1;
            console.log($page);
            if (lev >= 0) {

                let $prev_page = $page.parent().find(".page[lev=" + lev + "]");
                $page.removeClass("active");
                setTimeout(() => {
                    $page.remove();
                }, 1000);
                $prev_page.removeClass("below").addClass("active");

            }
            if (lev <= 0) {
                hideBackArrow();
            }
        },
        hideBackArrow = function () {
            $(".heading-arrow").addClass("hidden");
        },
        showBackArrow = function () {
            $(".heading-arrow").removeClass("hidden");
        },
        createCSSLink = function (url) {
            let link = document.createElement("link");
            link.href = url;
            link.rel = "stylesheet";
            link.type = "text/css";
            return link;
        },
        createRippleEffect = function ($button, evt) {
            let btn = $(evt.currentTarget);
            let x = evt.pageX - btn.offset().left;
            let y = evt.pageY - btn.offset().top;

            let ripple = $(`<span class="ripple"></span>`).appendTo($button).css({
                left: x,
                top: y
            });
            setTimeout(() => {
                ripple.remove();
            }, 500);
        },
        getLength = function (n) {
            return n.toString().length;
        }
    return {
        createPieChart: createPieChart,
        getVersion: getVersion,
        generateDate: generateDate,
        generateFullDate: generateFullDate,
        msToString: msToString,
        msToMin: msToMin,
        createFullPage: createFullPage,
        getLength: getLength,
        goToPrevPage: goToPrevPage,
        showBackArrow: showBackArrow,
        hideBackArrow: hideBackArrow,
        createRippleEffect: createRippleEffect
    }
}();


export {Util};