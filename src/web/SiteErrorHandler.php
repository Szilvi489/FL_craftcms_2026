<?php

namespace app\web;

use Craft;
use yii\web\HttpException;

class SiteErrorHandler extends \craft\web\ErrorHandler
{
    public function showExceptionDetails(): bool
    {
        $request = Craft::$app->has('request', true) ? Craft::$app->getRequest() : null;
        $exception = $this->exception;

        if (
            $request &&
            $request->getIsSiteRequest() &&
            $exception instanceof HttpException &&
            $exception->statusCode === 404
        ) {
            return false;
        }

        return parent::showExceptionDetails();
    }
}
