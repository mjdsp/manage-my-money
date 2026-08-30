<?php

it('redirects the root url into the app', function () {
    $this->get('/')->assertRedirect(route('dashboard'));
});

it('sends guests from the dashboard to login', function () {
    $this->get(route('dashboard'))->assertRedirect(route('login'));
});
