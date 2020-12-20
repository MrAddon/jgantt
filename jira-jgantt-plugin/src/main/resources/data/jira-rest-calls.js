const JiraRest = {

    // fields is an object, ex: {"modified": "2020-12-30", "description": "text"}
    editFields: function (issueIdOrKey, fields) {
        if ("created" in fields) {
            return new Error("The creation date cannot be freely modified.")
        }
        if ("updated" in fields) {
            return new Error("The updated date cannot be freely modified.")
        }

        return fetch(AJS.params.baseURL + '/rest/api/2/issue/' + issueIdOrKey, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({fields: fields})
        })
        .catch(error => console.error("Error while editing issue", error))
    },

    // inwardIssue y outwardIssue deben ser strings con la issue key
    createIssueLink: function (inwardIssue, outwardIssue, issueLinkTypeID) {
        const body = JSON.stringify({
            type:         {id: issueLinkTypeID},
            inwardIssue:  {key: inwardIssue},
            outwardIssue: {key: outwardIssue},
        })
        return fetch(AJS.params.baseURL + '/rest/api/2/issueLink', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: body,
        })
        .catch(error => console.error("Error while creating issue link", error))
    },

    deleteIssueLink: function (linkID) {
        return fetch(AJS.params.baseURL + '/rest/api/2/issueLink/' + linkID, {
            method: 'DELETE',
        })
        .catch(error => console.error("Error while deleting issue link", error))
    },

    getIssueLinkTypes: function () {
        return fetch(AJS.params.baseURL + '/rest/api/2/issueLinkType', {
            method: 'GET'
        }).then(resp => resp.json())
        .catch(error => console.error("Error while getting issue links", error))
    },

}