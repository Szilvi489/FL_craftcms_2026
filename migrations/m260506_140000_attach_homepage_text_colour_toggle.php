<?php

declare(strict_types=1);

namespace craft\contentmigrations;

use craft\db\Migration;
use craft\fieldlayoutelements\CustomField;

class m260506_140000_attach_homepage_text_colour_toggle extends Migration
{
    public function safeUp(): bool
    {
        $fieldsService = \Craft::$app->getFields();
        $entriesService = \Craft::$app->getEntries();

        $textColourToField = $fieldsService->getFieldByHandle('textColourTo');

        if ($textColourToField === null) {
            throw new \RuntimeException('The "textColourTo" field must exist before it can be attached to Homepage.');
        }

        $homepageEntryType = $entriesService->getEntryTypeByHandle('homepage');

        if ($homepageEntryType === null) {
            throw new \RuntimeException('The "homepage" entry type must exist before the text colour toggle can be attached.');
        }

        $fieldLayout = $homepageEntryType->getFieldLayout();
        $tabs = $fieldLayout->getTabs();
        $contentTab = $tabs[0] ?? null;

        if ($contentTab === null) {
            throw new \RuntimeException('The "homepage" entry type is missing its field layout tab.');
        }

        $existingHandles = [];

        foreach ($fieldLayout->getCustomFields() as $field) {
            $existingHandles[] = $field->handle;
        }

        if (in_array('textColourTo', $existingHandles, true)) {
            return true;
        }

        $elements = $contentTab->getElements();
        $elements[] = new CustomField($textColourToField, [
            'required' => false,
            'width' => 100,
        ]);

        $contentTab->setElements($elements);

        if (!$entriesService->saveEntryType($homepageEntryType)) {
            throw new \RuntimeException('Unable to save the "homepage" entry type with the text colour toggle field.');
        }

        return true;
    }

    public function safeDown(): bool
    {
        echo "m260506_140000_attach_homepage_text_colour_toggle cannot be reverted.\n";
        return false;
    }
}
