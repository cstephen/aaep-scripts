<% if(!_.isEmpty(cloud_cover)) { %>Cloud Cover: <%= cloud_cover %>
<% } %><% if(!_.isEmpty(precipitation)) { %>Precipitation: <%= precipitation %>
<% } %><% if(!_.isEmpty(visibility)) { %>Visibility: <%= visibility %>
<% } %><% if(!_.isEmpty(pressure_tendency)) { %>Pressure Tendency: <%= pressure_tendency %>
<% } %><% if(!_.isEmpty(pressure_value)) { %>Pressure: <%= pressure_value %>
<% } %><% if(!_.isEmpty(temperature_value) && !_.isEmpty(temperature_value)) { %>Temperature: <%= temperature_value %> <%= temperature_units %>
<% } %><% if(!_.isEmpty(wind_direction)) { %>Wind Direction: <%= wind_direction %>
<% } %><% if(!_.isEmpty(wind_value) && !_.isEmpty(wind_units)) { %>Wind: <%= wind_value %> <%= wind_units %>
<% } %><% if(!_.isEmpty(phenomenon)) { %>Phenomenon: <%= phenomenon %>
<% } %>

<% if(!_.isEmpty(body)) { %>
	<%= body %>
<% } %>