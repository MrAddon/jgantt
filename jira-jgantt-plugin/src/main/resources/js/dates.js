// MomentJS format: https://momentjs.com/docs/#/displaying/format/

function getDateFormatsFromCookie() {
    var gantt_date_format_dmy = readCookie("gantt_date_format_dmy")
    var gantt_date_format_complete = readCookie("gantt_date_format_complete")

    // set format vars to JIRA defaults if not set from cookie
    if (!gantt_date_format_dmy) {
        gantt_date_format_dmy = "d/MMM/yy"
    }
    if (!gantt_date_format_complete) {
        gantt_date_format_complete = "dd/MMM/yy h:mm a"
    }

    // Transform from JAVA date format to JS date format
    gantt_date_format_dmy = formatTranslator().toMomentFormatString(gantt_date_format_dmy)
    gantt_date_format_complete = formatTranslator().toMomentFormatString(gantt_date_format_complete)

    // Formats that we will use on momentjs
    return [gantt_date_format_dmy, gantt_date_format_complete]
}

function parseGanttDate(dateText, dateFormats) {
    if(!dateText) return moment.invalid()
    var res = {date: "", dateText: ""}
    var momentDate = moment(dateText, dateFormats, true)
    res.dateText = momentDate.format("DD-MM-YYYY")
    res.date = momentDate
    return res
}

function is_parsable_date(dateStr) {
    var dateFormats = getDateFormatsFromCookie()
    var date = moment(dateStr, dateFormats, true)
    return date._isValid
}

// 2020-04-27T16:27:10.000+0200 => 2020-04-27 16:27:10 (Date and time)
// 2020-04-27                   => 2020-04-27 00:00    (Date)
function parseJiraRESTDate(dateText) {
    // caso Date
    if (!dateText.includes(".")) {
        return dateText + " 00:00"
    }
    // caso Date and time
    let dot_split = dateText.split(".")
    if (dot_split.length != 2) {
        console.error("Error parsing jira rest date:" + dateText)
        return
    }
    return dot_split[0].replaceAll("T", " ")
}

function momentFormatForCFType(cftype) {
    switch(cftype){
        case "com.atlassian.jira.plugin.system.customfieldtypes:datetime":
            return "YYYY-MM-DDThh:mm:ss.sZZ"

        case "com.atlassian.jira.plugin.system.customfieldtypes:datepicker":
            return "YYYY-MM-DD"

        default:
            console.warn("Tipo de campo fecha no soportado??: " + cftype)
            return "YYYY-MM-DD"
    }
}

function array_equal(a1,a2) {
    return a1.length == a2.length && a1.every((v,i) => v === a2[i]);
}

// locale with Jira's format "lang_COUNTRY"
var localeWithJiraFormat = function() {
    var gantt_locale = readCookie("gantt_locale")
    return gantt_locale ? gantt_locale : "en"
}

// locale with MomentJS format "lang-country"
var localeWithMomentFormat = function () {
    var gantt_locale = readCookie("gantt_locale")
    if (!gantt_locale) {
        return "en"
    }
    return gantt_locale.toLocaleLowerCase().replace("_", "-")
}

//Function to read the cookies
function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}
