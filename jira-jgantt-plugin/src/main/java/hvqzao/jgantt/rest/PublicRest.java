package hvqzao.jgantt.rest;

import com.atlassian.jira.component.ComponentAccessor;
import com.atlassian.jira.config.properties.APKeys;
import com.atlassian.jira.config.properties.ApplicationProperties;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.net.URI;

/**
 * Rest to make some public version of admin-only services
 */

@Path("/public")
public class PublicRest {

    private final static String GETTING_STARTED_URL = "https://jirasupport.atlassian.net/wiki/spaces/AH/pages/546734101/Kanban+Gantt+for+JIRA+jGantt";
    private final ApplicationProperties appProps;

    public PublicRest() {
        // no he podido inyectar ApplicationProperties con spring scanner
        // TODO subir spring scanner a v2
        this.appProps = ComponentAccessor.getComponent(ApplicationProperties.class);
    }

    /**
     * Mimics a fetch to rest/api/2/application-properties?key=jira.lf.date.dmy
     */
    @GET
    @Path("lookNFeelDateFormats")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getLookNFeelDateFormat() {
        JiraLookNFeelDateFormatsResponse response = new JiraLookNFeelDateFormatsResponse();
        response.dateDMY = appProps.getDefaultBackedString(APKeys.JIRA_LF_DATE_DMY);
        response.dateComplete = appProps.getDefaultBackedString(APKeys.JIRA_LF_DATE_COMPLETE);
        return Response.ok(response).build();
    }

    @GET
    @Path("getting-started")
    // "Hacky" way to have an external getting started page
    // since post.install.url can only reference local urls
    public Response gettingStarted() {
        return Response.temporaryRedirect(URI.create(GETTING_STARTED_URL)).build();
    }

}
