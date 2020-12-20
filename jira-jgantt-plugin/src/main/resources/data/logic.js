(function(){
    var cleanup = function(what) {
        var nodes = document.getElementsByClassName(what);
        while (nodes[0]) {
            nodes[0].parentNode.removeChild(nodes[0]);
        }
    };

    var statusCategoryColorToCSSColor = {
        "blue-gray" : "steelblue",
        "yellow" : "yellow",
        "green" : "green",
    }

    var descriptionColorRxp = /\((\w+)\)/
    function getTaskColor(key) {
        if($('#statusColors').is(':checked')){
            var statusColor = "black" // default, in case of error
            $.ajax({
                url: AJS.contextPath() + "/rest/api/2/issue/" + key + "?fields=status",
                async: false,
                success: function(data){
                    // Obtenemos el color de la descripción, usando el regexp 'descriptionColorRxp'
                    var statusDescription = data.fields.status.description
                    var matches = statusDescription.match(descriptionColorRxp)
                    if (matches && matches[1]) {
                        statusColor = matches[1]
                    } else {
                        statusColor = statusCategoryColorToCSSColor[data.fields.status.statusCategory.colorName]
                    }
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    console.error("Error intentando obtener el estado de: " + key)
                    console.error("textStatus", textStatus)
                    console.error("errorThrown", errorThrown)
                }
            })
            return statusColor
        } else {
            // Usamos el color de la épica
            var ghxIssue = $(`div[data-issue-key="${key}"]`)
            var epic_element = $(ghxIssue).find('.ghx-highlighted-field span');
            if (epic_element.length > 0) {
                return $(epic_element[0]).css("background-color");
            }
        }
    }

    // TODO: Un mapa de colores CSS -> Blanco/Negro
    //       De momento, yellow hardcodeado porque es un color de statusCategory, y es ilegible con texto blanco
    function getAppropiateTextColor(bgColor) {
        if (bgColor == "yellow") {
            return "black"
        }
        return "white"
    }

    Zepto(function($) {

        $(`<div class="g4n7t" style="position:absolute;top:0;right:0;bottom:0;left:0;z-index:10;background-color:white">
            <form id="gantt_control" class="gantt_control">
            <input type="radio" id="scale1" class="gantt_radio" name="scale" value="day">
            <label for="scale1">Day scale</label>
            <input type="radio" id="scale2" class="gantt_radio" name="scale" value="week">
            <label for="scale2">Week scale</label>
            <input type="radio" id="scale3" class="gantt_radio" name="scale" value="month" checked>
            <label for="scale3">Month scale</label>
            <input type="radio" id="scale4" class="gantt_radio" name="scale" value="quarter">
            <label for="scale4">Quarter scale</label>
            <input type="radio" id="scale5" class="gantt_radio" name="scale" value="year">
            <label for="scale5">Year scale</label>
            </form>
            <div id="gantt_here" style="position:absolute;top:40px;right:0;bottom:0;left:0"></div>
        </div>`).appendTo('body');

        var now = new Date();
        var now_time = now.getTime();

        var params = (new URL(document.location)).searchParams
        var rapidViewID = params.get("rapidView")
        var gantt_date_format = "%Y-%m-%d %H:%i:%s" // spec: https://docs.dhtmlx.com/gantt/desktop__date_format.html

        var kcwipConfig = undefined
        var data = []
        var allLinks = []
        var aggregates = []

        let initKCWIPConfig = function() {
            // Get all fields from the rapid view config
            console.debug("Getting kanban gantt config")
            return fetch(AJS.params.baseURL + "/rest/kanban-admin/1.0/kanban-gantt-config?boardID="+rapidViewID)
            .then(resp => {
                if (resp.status === 404) {
                    window.alert("The current board does not have a Kanban Combined WIP Config set.")
                    return
                }
                return resp.json()
            })
            .then(boardConfig => kcwipConfig = boardConfig)
            .catch(function(error){
                console.error("Error while getting board's gantt config", error)
            })
        }

        // init the data and aggregate variables using the Combined Kanban WIP's board configuration
        let initDataUsingKCWIPConfig = function(){
            // reseteamos estas variables, por si venimos después de crear un link
            data = [];
            allLinks = [];
            aggregates = [];

            console.debug("Getting rapid view issues data")
            let {aggregateFieldID, startDateFieldID, endDateFieldID} = kcwipConfig
            // Fetch all issues from the board
            return fetch(AJS.params.baseURL + `/rest/agile/latest/board/${rapidViewID}/issue?fields=summary,issuelinks,${aggregateFieldID},${startDateFieldID},${endDateFieldID}`)
                .then(resp => {
                    return resp.json()
                })
                .then(jsonData => {
                    //console.debug(jsonData)
                    if (!jsonData) {
                        throw new Error("Could not get issues from board with id: " + rapidViewID)
                    }

                    let issueKeys = jsonData.issues.map(issue => issue.key)

                    // Add each issue...
                    jsonData.issues.forEach(issue => {
                        let fields = issue.fields

                        // No start date, we do nothing with this issue
                        if (fields[startDateFieldID] == null) {
                            return;
                        }

                        let aggregateField = fields[aggregateFieldID]
                        let aggregateText = ""

                        if (aggregateField == null || aggregateField.length === 0 || jQuery.isEmptyObject(aggregateField)) {
                            aggregateText = "(No value)"
                        } else if (typeof aggregateField === "string") {
                            aggregateText = aggregateField
                        } else if (aggregateField.name) {
                            aggregateText = aggregateField.name
                        } else if (Array.isArray(aggregateField)) {
                            if (typeof aggregateField[0] === "string") {
                                aggregateText = aggregateField.join(", ")
                            } else {
                                aggregateText = aggregateField.map(v => v.name).join(", ")
                            }
                        } else {
                            console.error("Caso no controlado: ", aggregateField)
                        }

                        let start_date = parseJiraRESTDate(fields[startDateFieldID])

                        if (aggregates.indexOf(aggregateText) == -1) {
                            aggregates.push(aggregateText);
                            data.push({id: aggregateText, text: aggregateText, owner: true, open: true, color: "#444"})
                        }

                        for (link of fields["issuelinks"]) {
                            // no lo hacemos con inwardIssue porque sería redundante si ambas issues estan en el gantt
                            if (link.outwardIssue && issueKeys.includes(link.outwardIssue.key)) {
                                let src = issue.key
                                let tgt = link.outwardIssue.key
                                allLinks.push({id:link.id, source:src, target:tgt, type:0, linkTypeID: link.type.id})
                            }
                        }

                        if (fields[endDateFieldID]) {
                            // If we have an end_date, add it normally
                            let end_date =  parseJiraRESTDate(fields[endDateFieldID])
                            data.push({
                                id:issue.key,
                                text:issue.key + " - " + fields.summary,
                                start_date: start_date,
                                end_date: end_date,
                                open: true,
                                color: getTaskColor(issue.key),
                                //progress: progress,
                                parent: aggregateText,
                            })
                        } else {
                            // End date field is null, add it with duration = 1
                            data.push({
                                id:issue.key,
                                text:issue.key + " - " + fields.summary,
                                start_date: start_date,
                                duration: 1,
                                open: true,
                                color: getTaskColor(issue.key),
                                //progress: progress,
                                parent: aggregateText,
                            })
                        }
                    })
                })
                .catch(function(error){
                    console.error("Error while getting issues from board", error)
                })
        }

        // init the data and aggregates variables using the first three fields on the tasks
        let initDataUsingTaskFields = function(){
            $('div.ghx-issue').each(function(){
                var extra = $(this).find('.ghx-extra-field-row');
                if (extra.length < 2) {
                    return;
                }
                var title = $(this).find('.ghx-summary').attr('title');
                var key = $(this).find('.ghx-key-link-project-key').text() + $(this).find('.ghx-key-link-issue-num').text()
                if (key == 0 ) {
                    key = $(this).find('.js-key-link').text()
                }
                
                var aggregate = $(extra[0]).text().replace(/FILTER_OUT/,'');
                //Raul change to accept Date-Time fields
                var startDateField = $(extra[1]).text();
                var endDateField = [undefined];
                if ($(extra[2]).text() != null) {
                    endDateField = $(extra[2]).text();
                }

                var gantt_date_formats = getDateFormatsFromCookie()
                var parsedStartDate = parseGanttDate(startDateField, gantt_date_formats)
                var parsedEndDate = parseGanttDate(endDateField, gantt_date_formats)

                if(!parsedStartDate || !parsedStartDate.date._isValid){
                    // No se pudo parsear la fecha de inicio
                    // Esto reemplaza la funcionalidad de la antigua variable "add"
                    return
                }

                if(!parsedEndDate || !parsedEndDate.date._isValid){
                    // No se pudo parsear la fecha fin
                    parsedEndDate = parsedStartDate
                }
                
                var start_date = parsedStartDate.date
                var start_text = parsedStartDate.dateText
                var end_date = parsedEndDate.date

                var duration = Math.round((end_date - start_date)/(1000*60*60*24));
                if (duration <= 0) {
                    duration = 0;
                }
                duration += 1; // magic number :)

                var start_date_time = start_date.valueOf();
                var end_date_time = end_date.valueOf();

                var progress;
                if (start_date_time > now_time) {
                    progress = 0;
                } else if (start_date_time <= now_time && end_date_time >= now_time) {
                    progress = (now_time - start_date_time)/(end_date_time - start_date_time);
                } else {
                    progress = 1;
                }

                // Create the task's aggregate if it doesnt exist yet
                if (aggregates.indexOf(aggregate) == -1) {
                    aggregates.push(aggregate);
                    data.push({id:aggregate, text:aggregate, owner:true, open: true, color: "#444"});
                }

                data.push({id:key, text:key + " - " + title, start_date:start_text, duration:duration, open:true, color:getTaskColor(key), progress:progress, parent:aggregate});
            });
        }

        gantt.config.row_height = 30;
        gantt.config.readonly = false;
        gantt.config.drag_links = true;
        gantt.config.drag_move = true;
        gantt.config.drag_progress = false;
        
        // default columns definition
        gantt.config.columns = [
            {name:"text",       label:"",  width:"*", tree:true ,resize:true },
            {name:"start_date", label:"Start date", align:"center" ,resize:true },
            {name:"duration",   label:"Duration",   align:"center" ,resize:true }
        ];
                        
        gantt.attachEvent("onTaskDblClick", function(id, e) {
            try  {
            var task = gantt.getTask(id);
            var text = task.text.split(" ")
            window.open(AJS.contextPath() + "/browse/"+text[0], "_blank");
            } catch ( e ) {}
        });
        
        //https://docs.dhtmlx.com/gantt/api__gantt_onscaleclick_event.html
                        
        var zoomConfig = {
        levels: [
            {
                name:"day",
                scale_height: 27,
                min_column_width:80,
                scales:[
                    {unit: "day", step: 1, format: "%d %M"}
                ]
            },
            {
                name:"week",
                scale_height: 50,
                min_column_width:50,
                scales:[
                    {unit: "week", step: 1, format: function (date) {
                        var dateToStr = gantt.date.date_to_str("%d %M");
                        var endDate = gantt.date.add(date, -6, "day");
                        var weekNum = gantt.date.date_to_str("%W")(date);
                        return "#" + weekNum + ", " + dateToStr(date) + " - " + dateToStr(endDate);
                    }},
                    {unit: "day", step: 1, format: "%j %D"}
                ]
            },
            {
                name:"month",
                scale_height: 50,
                min_column_width:120,
                scales:[
                    {unit: "month", format: "%F, %Y"},
                    {unit: "week", format: "Week #%W"}
                ]
            },
            {
                name:"quarter",
                height: 50,
                min_column_width:90,
                scales:[
                    {unit: "month", step: 1, format: "%M"},
                    {
                        unit: "quarter", step: 1, format: function (date) {
                            var dateToStr = gantt.date.date_to_str("%M");
                            var endDate = gantt.date.add(gantt.date.add(date, 3, "month"), -1, "day");
                            return dateToStr(date) + " - " + dateToStr(endDate);
                        }
                    }
                ]
            },
            {
                name:"year",
                scale_height: 50,
                min_column_width: 40,
                scales:[
                    {unit: "year", format: "%Y"}
                ]
            }
        ]};

        (async function(){
            await ifPluginLicensed("kanban-admin",
                async function(){
                    await initKCWIPConfig()
                    await initDataUsingKCWIPConfig()
                    console.log("Using gantt date format", gantt_date_format)
                    gantt.config.date_format = gantt_date_format;
                },
                initDataUsingTaskFields)

            gantt.ext.zoom.init(zoomConfig);
            gantt.ext.zoom.setLevel("month");
            gantt.ext.zoom.attachEvent("onAfterZoom", function(level, config){
                document.querySelector(".gantt_radio[value='" +config.name+ "']").checked = true;
            })
                
            gantt.init('gantt_here')
            gantt.parse({data:data})
            $('.g4n77').remove()        


            var today = new Date(now);
            today.setHours(0,0,0,0);
            var yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            gantt.showDate(yesterday);

            var radios = document.getElementsByName("scale");
            for (var i = 0; i < radios.length; i++) {
                radios[i].onclick = function (event) {
                    gantt.ext.zoom.setLevel(event.target.value);
                };
            }

            $('<button style="position:absolute;top:4ex;left:17ex">[NOW]</button>')
                .click(function(){
                    gantt.showDate(yesterday);
                })
                .appendTo('div.g4n7t');
                
            $('<button style="position:absolute;top:4ex;left:25ex">[PRINT]</button>')
                .click(function(){
                                    var originalContents = document.body.innerHTML;
                                    window.document.getElementById("page").style.visibility = "hidden";
                                    window.document.getElementById("ghx-detail-view").style.visibility = "hidden";
                                    var divContents = window.document.getElementsByClassName("gantt_container")[0].innerHTML
                                    document.innerHTML = divContents;
                                    window.print();
                                    document.innerHTML = originalContents;
                                    window.document.getElementById("page").style.visibility = "visible";
                                    window.document.getElementById("ghx-detail-view").style.visibility = "visible";
                })
                .appendTo('div.g4n7t');
                            
            var currFFZoom = 1;
            var currIEZoom = 100;
            $('<button style="position:absolute;top:4ex;left:7ex">[-]</button>')
                .click(function(){
                    if (navigator.userAgent.search("Firefox")>-1){
                                        var step = 0.1;
                                        currFFZoom -= step;                 
                                        //$('html').css('-moz-transform','scale(' + currFFZoom + ')');
                                        $('.gantt_container').css('-moz-transform-origin','left top');
                                        $('.gantt_container').css('-moz-transform','scale(' + currFFZoom + ')');
                                    } else {
                                        var step = 5;
                                        currIEZoom -= step;
                                        $('html').css('zoom', ' ' + currIEZoom + '%');
                                    }
                                    $(window).trigger('resize');
                })
                .appendTo('div.g4n7t');

            $('<button style="position:absolute;top:4ex;left:12ex">[+]</button>')
                .click(function(){
                    if (navigator.userAgent.search("Firefox")>-1){
                                        var step = 0.1;
                                        currFFZoom += step; 
                                        //$('html').css('-moz-transform','scale(' + currFFZoom + ')');
                                        $('.gantt_container').css('-moz-transform-origin','left top');
                                        $('.gantt_container').css('-moz-transform','scale(' + currFFZoom + ')');
                                    } else {
                                        var step = 5;
                                        currIEZoom += step;
                                        $('html').css('zoom', ' ' + currIEZoom + '%');
                                    }
                                    $(window).trigger('resize');
                })
                .appendTo('div.g4n7t');
                    
            $('<button style="position:absolute;top:4ex;left:1ex">[X]</button>')
                .click(function(){
                    cleanup("g4n7t");
                                    if (navigator.userAgent.search("Firefox")>-1){
                                        $('html').css('MozTransform','scale(1)');
                                    } else {
                                        $('html').css('zoom', '100%');
                                    }
                                    $(window).trigger('resize');
                })
                .appendTo('div.g4n7t');

            ifPluginLicensed("newstatuscolorspro", function(){
                // Adds the checkbox to the control panel
                $("#gantt_control").append(
                    '<input type="checkbox" id="statusColors" class="gantt_checkbox" name="statusColors" >' +
                    '<label for="statusColors">Use Status colors</label>'
                )

                // Actualiza los colores de las tarjetas al cambiar el estado del checkbox status colors
                $('#statusColors').change(function() {
                    $('div.ghx-issue').each(function(){
                        var key = $(this).find('.ghx-key-link-project-key').text() + $(this).find('.ghx-key-link-issue-num').text()
                        if (key == 0 ) {
                            key = $(this).find('.js-key-link').text()
                        }
                        if(gantt.isTaskExists(key)){
                            var task = gantt.getTask(key)
                            task.color = getTaskColor(key)
                            task.textColor = getAppropiateTextColor(task.color)
                        }
                    })
                    gantt.refreshData();
                })
            });

            ifPluginLicensed("jiraissuecardprinter", function() {
                // Adds the checkbox to the control panel
                $("#gantt_control").append(`
                <span style="margin-left: 12px; margin-right: 12px;">
                    <label for="jganttExports">Export to:</label>
                    <button onclick='gantt.exportToPDF()'>PDF</button>
                    <button onclick='gantt.exportToPNG()'>PNG</button>
                    <button onclick='gantt.exportToICal()'>iCal</button>
                    <button onclick='gantt.exportToExcel()'>Excel</button>
                </span>`)
            });

            ifPluginLicensed("kanban-admin", async function() {
                console.debug("Kanban-admin installed, moving tasks will update the issue")

                // ********************** Movimiento de issues **********************
                gantt.attachEvent("onBeforeTaskUpdate", (id, item) => {
                    if (!kcwipConfig) {
                        console.warn("Issue moved, but the kanban config is not set!")
                        return
                    }
                    let newStartDate = item.start_date
                    let newEndDate = item.end_date
                    let fields = {}
                    fields[kcwipConfig.startDateFieldID] = moment(newStartDate).format(momentFormatForCFType(kcwipConfig.startDateFieldType))
                    fields[kcwipConfig.endDateFieldID] = moment(newEndDate).format(momentFormatForCFType(kcwipConfig.endDateFieldType))

                    console.debug("setting new dates for: " + id, fields)
                    JiraRest.editFields(id, fields)
                        .then(initDataUsingKCWIPConfig)
                        .catch(err => {window.alert(err.message)})
                })

                // ********************** Enlazado de issues **********************

                // Creamos el selector de issue type
                let options = ""
                for(linkType of (await JiraRest.getIssueLinkTypes()).issueLinkTypes) {
                    options += `<option value="${linkType.id}">${linkType.name}</option>`
                }
                $("#gantt_control").append(`
                <span style="margin-left: 12px; margin-right: 12px;">
                    <label for="linktype">Link type</label>
                    <select id="linktype" name="linktype">${options}</select>
                </span>`)
                $("#linktype").val(kcwipConfig.defaultLinkTypeID)

                // Lógica para mostrar links existentes
                const refreshLinks = function() {
                    // Borramos los links existentes
                    gantt.clearAll();
                    var links = []
                    // Añadimos los links, filtrando por el tipo seleccionado
                    for (newLink of allLinks.filter(l => l.linkTypeID == $("#linktype").val())) {
                        links.push(newLink)
                    }
                    gantt.parse({data:data, links:links})
                }
                refreshLinks() // primer refresh (init)
                $("#linktype").change(refreshLinks)

                // Lógica de creación de links
                gantt.attachEvent("onBeforeLinkAdd", function(id, link){
                    if (aggregates.includes(link.source) || aggregates.includes(link.target)) {
                        alert("Issues can not be linked with aggregates")
                        return false
                    }
                    let linkTypeID = $("#linktype").val()
                    if (!linkTypeID) {
                        alert("No link type selected")
                        return false
                    }
                    (async function() {
                        // creamos el enlace y recargamos los datos para obtener el ID del enlace creado
                        await JiraRest.createIssueLink(link.source, link.target, linkTypeID)
                        await initDataUsingKCWIPConfig()
                        refreshLinks()
                    })()
                });

                // Lógica de borrado de links
                gantt.attachEvent("onLinkDblClick", function(id, e) {
                    if (window.confirm("Do you really want to delete that link?")) {
                        JiraRest.deleteIssueLink(id, e).then(() => {
                            allLinks = allLinks.filter(l => l.id != id)
                            refreshLinks()
                        })
                    }
                    return false // prevent default confirmation dialog
                });
            }, function() {
                gantt.attachEvent("onAfterTaskUpdate", (id, item) => {
                    alert("[ALERT] Kanban Combined WIP not installed or licensed, changes will not be persistent!")
                });
                gantt.attachEvent("onLinkCreated", (link) => {
                    alert("You need to have Kanban Combined WIP installed and licensed in order to manage links from Kanban Gantt for Jira")
                    return false
                });
            })
                
        }())

    });    
})();
