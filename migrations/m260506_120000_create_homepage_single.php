<?php

declare(strict_types=1);

namespace craft\contentmigrations;

use craft\db\Migration;
use craft\elements\Entry;
use craft\fieldlayoutelements\CustomField;
use craft\fields\Assets;
use craft\models\EntryType;
use craft\models\FieldLayout;
use craft\models\FieldLayoutTab;
use craft\models\Section;
use craft\models\Section_SiteSettings;

class m260506_120000_create_homepage_single extends Migration
{
    public function safeUp(): bool
    {
        $fieldsService = \Craft::$app->getFields();
        $entriesService = \Craft::$app->getEntries();
        $volumesService = \Craft::$app->getVolumes();
        $sitesService = \Craft::$app->getSites();

        $volume = $volumesService->getVolumeByHandle('projectMedia');

        if ($volume === null) {
            throw new \RuntimeException('The "projectMedia" volume must exist before creating the homepage image field.');
        }

        $indexImageField = $fieldsService->getFieldByHandle('indexImage');

        if ($indexImageField === null) {
            $indexImageField = new Assets([
                'name' => 'Index Image',
                'handle' => 'indexImage',
                'instructions' => 'Select the full-screen landing image for the homepage.',
                'searchable' => false,
                'translationMethod' => 'none',
                'allowSelfRelations' => false,
                'allowSubfolders' => true,
                'allowUploads' => true,
                'allowedKinds' => ['image'],
                'defaultPlacement' => 'end',
                'defaultUploadLocationSource' => "volume:$volume->uid",
                'maintainHierarchy' => false,
                'maxRelations' => 1,
                'previewMode' => 'full',
                'restrictFiles' => true,
                'restrictLocation' => false,
                'selectionLabel' => 'Add homepage image',
                'showSearchInput' => true,
                'showSiteMenu' => false,
                'showUnpermittedFiles' => false,
                'showUnpermittedVolumes' => false,
                'sources' => ["volume:$volume->uid"],
                'targetSiteId' => null,
                'validateRelatedElements' => false,
                'viewMode' => 'cards',
            ]);

            if (!$fieldsService->saveField($indexImageField)) {
                throw new \RuntimeException('Unable to save the "indexImage" field.');
            }
        }

        $homepageEntryType = $entriesService->getEntryTypeByHandle('homepage');

        if ($homepageEntryType === null) {
            $fieldLayout = new FieldLayout([
                'type' => Entry::class,
            ]);

            $contentTab = new FieldLayoutTab([
                'name' => 'Content',
                'layout' => $fieldLayout,
            ]);

            $contentTab->setElements([
                new CustomField($indexImageField, [
                    'required' => false,
                ]),
            ]);

            $fieldLayout->setTabs([$contentTab]);

            $homepageEntryType = new EntryType([
                'name' => 'Homepage',
                'handle' => 'homepage',
                'hasTitleField' => false,
                'titleFormat' => 'Homepage',
                'showSlugField' => false,
                'showStatusField' => false,
            ]);

            $homepageEntryType->setFieldLayout($fieldLayout);

            if (!$entriesService->saveEntryType($homepageEntryType)) {
                throw new \RuntimeException('Unable to save the "homepage" entry type.');
            }
        }

        $primarySite = $sitesService->getPrimarySite();
        $homepageSection = $entriesService->getSectionByHandle('homepage') ?? new Section();

        $homepageSection->name = 'Homepage';
        $homepageSection->handle = 'homepage';
        $homepageSection->type = Section::TYPE_SINGLE;
        $homepageSection->enableVersioning = true;
        $homepageSection->previewTargets = [
            [
                'label' => 'Primary entry page',
                'refresh' => '1',
                'urlFormat' => '{url}',
            ],
        ];
        $homepageSection->setEntryTypes([$homepageEntryType]);
        $homepageSection->setSiteSettings([
            new Section_SiteSettings([
                'siteId' => $primarySite->id,
                'enabledByDefault' => true,
                'hasUrls' => true,
                'uriFormat' => '__home__',
                'template' => 'index.twig',
            ]),
        ]);

        if (!$entriesService->saveSection($homepageSection)) {
            throw new \RuntimeException('Unable to save the "homepage" section.');
        }

        return true;
    }

    public function safeDown(): bool
    {
        echo "m260506_120000_create_homepage_single cannot be reverted.\n";
        return false;
    }
}
