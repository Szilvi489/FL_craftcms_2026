<?php

declare(strict_types=1);

namespace craft\contentmigrations;

use craft\db\Migration;
use craft\fieldlayoutelements\CustomField;
use craft\fields\PlainText;

class m260506_130000_add_homepage_hole_fields extends Migration
{
    public function safeUp(): bool
    {
        $fieldsService = \Craft::$app->getFields();
        $entriesService = \Craft::$app->getEntries();

        $fieldConfigs = [
            'coverHoleTop' => [
                'name' => 'Cover Hole Top',
                'instructions' => 'Top offset for the square hole. Use a CSS value like 12vh, 8rem, 120px, or 20%.',
                'placeholder' => '12vh',
            ],
            'coverHoleLeft' => [
                'name' => 'Cover Hole Left',
                'instructions' => 'Left offset for the square hole. Use a CSS value like 55vw, 8rem, 120px, or 20%.',
                'placeholder' => '55vw',
            ],
            'coverHoleSizeWidth' => [
                'name' => 'Cover Hole Size Width',
                'instructions' => 'Width of the square hole. Use a CSS value like 18vw, 16rem, 240px, or 30%. The hole stays square.',
                'placeholder' => '18vw',
            ],
        ];

        $createdFields = [];

        foreach ($fieldConfigs as $handle => $config) {
            $field = $fieldsService->getFieldByHandle($handle);

            if ($field === null) {
                $field = new PlainText([
                    'name' => $config['name'],
                    'handle' => $handle,
                    'instructions' => $config['instructions'],
                    'searchable' => false,
                    'translationMethod' => 'none',
                    'code' => true,
                    'multiline' => false,
                    'initialRows' => 1,
                    'placeholder' => $config['placeholder'],
                    'uiMode' => 'normal',
                ]);

                if (!$fieldsService->saveField($field)) {
                    throw new \RuntimeException("Unable to save the \"$handle\" field.");
                }
            }

            $createdFields[$handle] = $field;
        }

        $homepageEntryType = $entriesService->getEntryTypeByHandle('homepage');

        if ($homepageEntryType === null) {
            throw new \RuntimeException('The "homepage" entry type must exist before hole fields can be attached.');
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

        $elements = $contentTab->getElements();

        if (!in_array('coverHoleTop', $existingHandles, true)) {
            $elements[] = new CustomField($createdFields['coverHoleTop'], [
                'required' => false,
                'width' => 33,
            ]);
        }

        if (!in_array('coverHoleLeft', $existingHandles, true)) {
            $elements[] = new CustomField($createdFields['coverHoleLeft'], [
                'required' => false,
                'width' => 33,
            ]);
        }

        if (!in_array('coverHoleSizeWidth', $existingHandles, true)) {
            $elements[] = new CustomField($createdFields['coverHoleSizeWidth'], [
                'required' => false,
                'width' => 34,
            ]);
        }

        $contentTab->setElements($elements);

        if (!$entriesService->saveEntryType($homepageEntryType)) {
            throw new \RuntimeException('Unable to save the "homepage" entry type with the new hole fields.');
        }

        return true;
    }

    public function safeDown(): bool
    {
        echo "m260506_130000_add_homepage_hole_fields cannot be reverted.\n";
        return false;
    }
}
