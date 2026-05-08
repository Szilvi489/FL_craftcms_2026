<?php

use app\web\SiteErrorHandler;

return [
    'components' => [
        'errorHandler' => [
            'class' => SiteErrorHandler::class,
            'errorAction' => 'templates/render-error',
        ],
    ],
];
