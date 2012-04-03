from django.conf.urls.defaults import patterns, include, url
from cityhelper.views import HomePage, About

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    url(r'^$', HomePage.as_view(), name='home'),
	url(r'^about', About.as_view(), name='about'),
    # url(r'^cityhelper/', include('cityhelper.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
)
