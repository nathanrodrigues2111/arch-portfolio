// Every request goes to the spatialdiscourse Worker, which runs the site and the editor.
export const onRequest = ({ request, env }) => env.SITE.fetch(request);
