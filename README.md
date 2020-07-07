# WXRGen
####WordPress WXR(XML) file generator for importing data to wordpress website.
Inspired by [firekylin's WXR generator](https://github.com/firekylin/wxr-generator).

This tool helps you to create well-formed WXR instead of messy one with tags and attachments on the same place.
Allows you to form Wordpress WXR document for importing posts, pages, categories, tags, menus, menu items, users,
WooCommerce products, product categories and product attributes, media files for products and posts.

See JSDoc for parameters and stuff.

##Installation
```shell script
npm i wxrgen --save
```
##Usage
```js
const WXRGen = require('wxrgen');
const fs = require('fs');

const generator = new WXRGen({
    name: 'localhost',
    url: 'http://localhost',
    description: '',
    language: 'en-US',
});

//categories, attributes, images and tags will be created automatically
generator.setProductToAdd({
    url: '',
    title: 'TEST',
    author: 'wordpress',
    content: 'This is some product',
    regular_price: 9.99,
    downloadable: 'yes',
    summary: 'short description',
    categories: 'Top > Middle > Sub', //yep, hierarchy is supported
    attributes: [{name: 'size', value: '12'}, {name: 'weight', value: '4'}, {name: 'color', value: 'white'}],
    images: [{url: 'https://i.imgur.com/B21m40g.png' }, {url: 'https://i.imgur.com/0P6Z0I3.png' }],
});

let category = generator.termsToAdd.filter((item) => item.name === 'Top');
category = category[0];
const id = generator.rId();

generator.setMenuItemToAdd({
    id,
    author: 'wordpress', 
    url: `http://localhost/blog/${id}/`, 
    menu_name: 'MainMenu', //menu will be added automatically
    menu_item_object: 'product_cat', 
    menu_item_object_id: category.id
});

//save result
fs.writeFileSync('./result.xml', generator.generateWXR());

```

##API
####new WXRGen(object)
Initializes generator with next parameters:
* `name` {string} - site title
* `url` {string} - site url
* `description` {string} - site description
* `language` {string|null} - site language, default is 'en-US'
* `base_site_url` {string|null} - same as url
* `base_blog_url` {string|null} - same as url
#####Example
```js
    const WXRGen = require('wxrgen');
    const generator = new WXRGen({
        name: 'localhost',
        url: 'http://localhost',
        description: 'This is my local wordpress website',
        language: 'en-US',
    });
```

##Safe methods that will generate you the correct WXR

####setTermToAdd(object)
This method used mostly in other methods, 
you don't usually have to explicitly call it.

__Sets term to add to the beginning of document.__

The parameters are:
* `id` {number|null} - term Id. If not provided, random ID will be generated.
* `name` {string} - __mandatory!__ term title
* `slug` {string|null} - term slug. If not provided, it will be generated from term title or value if it's an attribute.
* `parent_id` {number|null} - term parent id if it exists.
* `description` {string|null} - description, usually empty string
* `value` {string|null} - term value, used in attributes, e.g. '10 Kg'.
* `taxonomy` {string|null} - term taxonomy, used in attributes, if none present, it will be generated from term title, e.g. 'pa_weight'
* `type` {string} - __mandatory!__ term type, can be 'category', 'product_cat', 'product_attribute', 'nav_menu' and 'tag'

#####Example
```js
generator.setTermToAdd({
    name: 'Super Category',
    type: 'product_cat'    
});
generator.setTermToAdd({
    name: 'Size',
    value: 'Large',
    type: 'product_attribute'
});
```

####setMenuItemToAdd(object)
__Sets menu item to add to the beginning of document.__

The parameters are:
* `id` {number|null} - menu item ID. If not present, random ID will be generated.
* `title` {string} - menu item title.
* `url` {string|null} - menu item url. Defaults to empty string.
* `date` {Date|null} - date of menu item publication. If none present, current date is used.
* `author` {string|null} - username of menu author. Defaults to 'wordpress'.
* `guid` {string}
* `content` {string|null} - menu item content. Defaults to empty string.
* `excerpt` {string|null} - menu item summary. Defaults to empty string.
* `status` {string|null} - menu item status (post status). Options: 'draft', 'pending', 'private' and 'publish'. Default is 'publish'.
* `parent` {number|null} - ID of parent menu item. Defaults to 0.
* `menu_order` {number|null} - position in menu. Defaults to 0.
* `password` {string|null} - menu item password
* `menu_name` {string} - name of menu to which this item will be added.
* `menu_item_object_id` {number} - ID of the category this item will be referencing.
* `menu_item_object` {string} - type of menu_item_object_id, usually 'product_cat'.
* `menu_item_type` {string|null} - type of menu item. Defaults to 'taxonomy'.
* `menu_item_menu_item_parent` {number|null} - parent of menu item. Defaults to 0.
* `menu_item_target` {string|null} - target of menu item. Defaults to empty string.
* `menu_item_classes` {array|null} - classes of menu item. Defaults to empty array.
* `menu_item_xfn` {string|null} - defaults to empty string
* `menu_item_url` {string|null} - defaults to empty string
#####Example
```js
const id = generator.rId();

// retrieve product category from terms to add
let category = generator.termsToAdd.filter((item) => item.name === 'Super Category');
category = category[0];

// add product category as menu item
generator.setMenuItemToAdd({
    id,
    author: 'wordpress', 
    url: `http://localhost/blog/${id}/`, 
    menu_name: 'MainMenu', //menu term will be added automatically
    menu_item_object: 'product_cat', 
    menu_item_object_id: category.id
});
```

####setPostToAdd(object)
__Sets post to add to the document. All of its categories and tags will be added automatically.__

The parameters are:
* `id` {number|null} - post Id, if not provided, random ID will be generated.
* `url` {string} - post permalink url.
* `date` {Date|null} - post create time. Defaults to current date and time.
* `title` {string} - post title.
* `slug` {string|null} - post slug name if it exists. If not, one will be generated from title.
* `author` {string|null} - post author, it equals author's login name. Defaults to 'wordpress'.
* `content` {string} - post content.
* `summary` {string} - post summary, short description.
* `comment_status` {string|null} - post comment status, default is 'open', it can be 'open' or 'close'.
* `ping_status` {string|null} - post ping status, default is 'open', it can be 'open' or 'close'.
* `status` {string|null} - post status. Can be 'publish', 'future', 'draft', 'pending', 'private', 'trash', 'auto-draft' and 'inherit'.
* `type` {string|null} - post type. Default is 'post' for posts.
* `password` {string|null} - post visit password if it should, default is empty.
* `categories` {array} - post categories, it's an array item. Every item should has 'slug' and 'name' prototype.
* `tags` {array} - post tags, it's an array item. Every item should has 'slug' and 'name' prototype.
* `imageID` {number|null} - ID of preloaded image hosted on YOUR website. Will be used as a thumbnail.
#####Example
```js
generator.setPostToAdd({
    url: 'http://localhost/post-1/',
    title: 'My very first post',
    author: 'wordpress',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    slug: 'post-1',
    summary: 'My first post',
});
```

####setPageToAdd(object)
__Sets page to add to the document. Parameters are the same as of post. All of its categories and tags will be added automatically.__

The parameters are:
* `id` {number|null} - page Id, if not provided, random ID will be generated.
* `url` {string} - page permalink url.
* `date` {Date|null} - page create time. Defaults to current date and time.
* `title` {string} - page title.
* `slug` {string|null} - page slug name if it exists. If not, one will be generated from title.
* `author` {string|null} - page author, it equals author's login name. Defaults to 'wordpress'.
* `content` {string} - page content.
* `summary` {string} - page summary, short description.
* `comment_status` {string|null} - page comment status, default is 'open', it can be 'open' or 'close'.
* `ping_status` {string|null} - page ping status, default is 'open', it can be 'open' or 'close'.
* `status` {string|null} - page status. Can be 'publish', 'future', 'draft', 'pending', 'private', 'trash', 'auto-draft' and 'inherit'.
* `type` {string|null} - page type. Default is 'page' for pages.
* `password` {string|null} - page visit password if it should, default is empty.
* `categories` {array} - page categories, it's an array item. Every item should have 'slug' and 'name' prototype.
* `tags` {array} - page tags, it's an array item. Every item should have 'slug' and 'name' prototype.
* `imageID` {number|null} - ID of preloaded image hosted on YOUR website. Will be used as a thumbnail.
#####Example
```js
generator.setPageToAdd({
    url: 'http://localhost/terms-and-conditions-page/',
    title: 'Terms And Conditions',
    author: 'wordpress',
    content: fs.readFileSync(`./html/terms.html`),
    slug: 'terms-and-conditions-page',
    summary: '',
});
```

####setProductToAdd(object)
__Sets product to add to the document. 
All it's categories, attributes, tags and images will be added automatically.__

__*You have to install and activate WooCommerce plugin before importing!*__

The parameters are:
* `id` {number|null} - product Id, if not provided, random ID will be generated.
* `url` {string} - product permalink url.
* `title` {string} - product title.
* `slug` {string|null} - product slug. If none present, it will be generated from title.
* `date` {Date|null} - product publication date. Defaults to current date.
* `author` {string|null} - product author, it equals author's login name. Defaults to 'wordpress'.
* `content` {string} - product description.
* `summary` {string} - product description summary.
* `comment_status` {string|null} - post comment status, default is 'open', it can be 'open' or 'close'.
* `ping_status` {string|null} - post ping status, default is 'open', it can be 'open' or 'close'.
* `type` {string|null} - product type. Options: 'simple', 'grouped', 'external' and 'variable'. Default is 'simple'.
* `status` {string|null} - product status (post status). Options: 'draft', 'pending', 'private' and 'publish'. Default is 'publish'.
* `password` {string|null} - password
* `categories` {array|string} - array or string representing product categories.
    If an array, it should be like ```{name: 'Top', slug: 'top'}, {name: 'Second'}]```.
    See addProductCategory() for possible attributes. Only 'name' attribute is mandatory.
    If your categories are represented as string, you can set a list of product categories keeping it's hierarchy like this:
    'Top > Middle > Sub', in this case 'Top' will be top category and have 'Middle' as it's child, 'Sub' is a child of 'Middle' and so on.
    Categories are added even if you haven't explicitly called addProductCategory.
    
* `attributes` {array} - array of product attributes. Every item should have at least 'name' and 'value' attributes.
    See addProductAttribute() for possible attributes.
    Attributes are added even if you haven't explicitly called addProductAttribute().

* `tags` {array} - array of product tags. Every element should have 'name' and 'slug' attributes.
* `images` {array} - array of urls or objects representing product images. See addAttachment for all possible attributes.
* `featured` {string|null} - Featured product. Default is 'no'.
* `catalog_visibility` {string|null} - Catalog visibility. Options: 'visible', 'catalog', 'search' and 'hidden'. Default is 'visible'.
* `sku` {string|null} - product unique identifier, SKU. Defaults to empty string.
* `regular_price` {number|null} - product price. Defaults to 0.00.
* `sale_price` {number|null} - product price while it is on sale. Defaults to empty string.
* `sale_price_dates_from` {Date|null} - date to start sale from. Defaults to empty string.
* `sale_price_dates_to` {Date|null} - date to stop sale. Defaults to empty string.
* `tax_status` {string|null} - product tax status. Defaults to 'taxable', more options: 'shipping' and 'none'.
* `tax_class` {string|null} - tax class.
* `reviews_allowed` {string|null} - Allow reviews. Default is 'true'.
* `manage_stock` {string|null} - Stock management at product level. Default is false.
* `backorders` {string|null} - If managing stock, this controls if backorders are allowed. Options: 'no', 'notify' and 'yes'. Default is 'no'.
* `sold_individually` {string|null} - Allow one item to be bought in a single order. Default is 'false'.
* `weight` {string|null} - product weight.
* `length` {string|null} - product length.
* `width` {string|null} - product width.
* `height` {string|null} - product height.
* `shipping_class` {string|null} - shipping class slug.
* `upsell_ids` {array|null} - array of ids of upsell products
* `crossell_ids` {array|null} - array of ids of crossell products
* `parent_id` {number|null} - Product parent ID.
* `purchase_note` {string|null} - Optional note to send the customer after purchase.
* `default_attributes` {array|null} - Array of default attributes.
* `grouped_products` {array|null} - Array of grouped products IDs.
* `menu_order` {number|null} - Menu order, used to custom sort products.
* `virtual` {string|null} - If the product is virtual. Default is 'no'.
* `downloadable` {string|null} - If the product is downloadable. Default is 'no'.
* `external_url` {string|null} - Product external URL. Only for external products.
* `button_text` {string|null} - Product external button text. Only for external products.
* `download_limit` {number|null} - Number of times downloadable files can be downloaded after purchase. Default is -1.
* `download_expiry` {number|null} - Number of days until access to downloadable files expires. Default is -1.
* `stock` {number|null} - stock quantity
* `stock_status` {string|null} - Controls the stock status of the product. Options: 'instock', 'outofstock', 'onbackorder'. Default is 'instock'.
* `downloadable_files` {array|null} - List of downloadable files.
* `price` {number|null} - price of product. Defaults to regular_price.
* `product_version` {string|null} - product generator version. Defaults to 3.9.2.
#####Example
```js
generator.setProductToAdd({
    url: '',
    title: 'SECOND',
    author: 'wordpress',
    content: 'SUUUUUPER',
    downloadable: 'yes',
    summary: 'sUmMarY',
    categories: [{name: 'Super Category'}, {name: Second Category}], //In this case it's not hierarchycal
    attributes: [{name: 'size', value: '1'}, {name: 'color', value: '1'}],
    images: [{url: 'http://localhost/test/data/images/a8336254-c041-4988-9873-b9eb6ab03959.jpeg' }, {url: 'http://localhost/test/data/images/b2a39a1a-7639-4d35-9e4e-29e44753d1bd.jpeg'}],
});
generator.setProductToAdd({
    url: '',
    title: 'TEST',
    author: 'wordpress',
    content: 'This is some product',
    regular_price: 9.99,
    downloadable: 'yes',
    summary: 'short description',
    categories: 'Top > Middle > Sub', //This IS hierarchycal
    attributes: [{name: 'size', value: '12'}, {name: 'weight', value: '4'}, {name: 'color', value: 'white'}],
    images: [{url: 'https://i.imgur.com/B21m40g.png' }, {url: 'https://i.imgur.com/0P6Z0I3.png' }],
});
```

####setAttachmentToAdd(object)
__Sets attachment to add to the end of a document. This is used for importing media to posts, pages or products. 
You don't usually have to explicitly call this.__

The parameters are:

* `id` {number|null}  - attachment Id. If not provided, random ID will be generated.
* `url` {string}  - attachment absolute url.
* `date` {Date|null}  - attachment create time. Defaults to current date.
* `file` {string|null}  - attachment relative path if it exist.
* `title` {string}  - attachment title.
* `author` {string|null}  - attachment uploader. Defaults to 'wordpress'.
* `description` {string|null}  - attachment description. Defaults to empty string.
* `post_id` {number}  - post id relate to the attachment.
* `comment_status` {string|null}  - attachment comment status, default is 'open', it can be 'open' or 'closed'.
* `ping_status` {string|null}  - post ping status, default is 'open', it can be 'open' or 'closed'.
* `meta_data` {string|null}  - other serialized attach meta data.
* `attachment_type` {string|null}  - type of an attachment. Defaults to 'product_image'.
#####Example
```js
generator.setAttachmentToAdd({
    url: 'https://i.imgur.com/B21m40g.png',
    title: 'Image',
    post_id: 0
});
```

####setUserToAdd(object)
__Sets user to add to the beginning of a document.__

The parameters are:

* `id` {number|null}  - user ID. If none present, random ID will be generated.
* `username` {string}  - user login
* `email` {string}  - user email
* `display_name` {string}  - user nickname
* `first_name` {string|null}  - user first name. Defaults to empty string.
* `last_name` {string|null}  - user last name. Defaults to empty string.
#####Example
```js
generator.setUserToAdd({
    username: 'admin',
    email: 'test@test.net',
    display_name: 'Admin'
});
```

##Forming the document

After you have called all of your methods that set something to add, you should use
```js
generator.generateWXR();
```
With or without following options:

* `pretty` {boolean}  - whether to pretty print the output or not. Defaults to false.
* `indent` {string}  - standard indentation. Defaults to four spaces.
* `newline` {string}  - new line character. Defaults to '\n'.

#####Example:
```js
fs.writeFileSync('./minified.xml', generator.generateWXR());
fs.writeFileSync('./pretty.xml', generator.generateWXR({ pretty: true }));
```

__Note that calling ```generator.stringify()``` will have no effect as your XML is empty at this point and everything is forming here.__

##Helper functions
####generator.generateSlug(name)
All non-alphanumeric characters are replaced with '-'.
The parameters are:
* `name` {string|number} - name to generate slug of.

####generator.generateTaxonomy(name)
All non-alphanumeric characters are replaced with underscores.
The parameters are:
* `name` {string|number} - name to generate taxonomy of.

####generator.generateCDataArray(arr)
Converts JS array to CData array notation.
The parameters are:
* `arr` {array} - array to generate CData array notation of.

####generator.generateAttributesCData(arr)
Generates CData encoded array notation string for attributes.
The parameters are:
* `attributes` {array} - array to generate CData array notation of.

####generator.getShortTypeOf(variable)
Gets type of variable for CDATA.
The parameters are:
* `variable` - variable to get type of.

##

This is the end of safe methods. Next methods will provide same functionality as above
__although I do not recommend you to use them! Your WXR will be a mess unless you write a ton of useless code. You will have to manually keep the order of adding!__

##Unsafe methods

####addPost(object)
__Adds post to current position of document. All of its categories and tags terms will be added above.__

The parameters are:
* `id` {number|null} - post Id, if not provided, random ID will be generated.
* `url` {string} - post permalink url.
* `date` {Date|null} - post create time. Defaults to current date and time.
* `title` {string} - post title.
* `slug` {string|null} - post slug name if it exists. If not, one will be generated from title.
* `author` {string|null} - post author, it equals author's login name. Defaults to 'wordpress'.
* `content` {string} - post content.
* `summary` {string} - post summary, short description.
* `comment_status` {string|null} - post comment status, default is 'open', it can be 'open' or 'close'.
* `ping_status` {string|null} - post ping status, default is 'open', it can be 'open' or 'close'.
* `status` {string|null} - post status. Can be 'publish', 'future', 'draft', 'pending', 'private', 'trash', 'auto-draft' and 'inherit'.
* `type` {string|null} - post type. Default is 'post' for posts.
* `password` {string|null} - post visit password if it should, default is empty.
* `categories` {array} - post categories, it's an array item. Every item should has 'slug' and 'name' prototype.
* `tags` {array} - post tags, it's an array item. Every item should has 'slug' and 'name' prototype.
* `imageID` {number|null} - ID of preloaded image hosted on YOUR website. Will be used as a thumbnail.
#####Example
```js
generator.addPost({
    url: 'http://localhost/post-1/',
    title: 'My very first post',
    author: 'wordpress',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    slug: 'post-1',
    summary: 'My first post',
    categories: [{name: 'Cool'}],
    tags: [{name: 'tag'}]
});
```

####addProduct(object)
__Adds product to the current position of document.
All of its categories, attributes and tags will be added above, images will be added beyond.__

__*You have to install and activate WooCommerce plugin before importing!*__

The parameters are:
* `id` {number|null} - product Id, if not provided, random ID will be generated.
* `url` {string} - product permalink url.
* `title` {string} - product title.
* `slug` {string|null} - product slug. If none present, it will be generated from title.
* `date` {Date|null} - product publication date. Defaults to current date.
* `author` {string|null} - product author, it equals author's login name. Defaults to 'wordpress'.
* `content` {string} - product description.
* `summary` {string} - product description summary.
* `comment_status` {string|null} - post comment status, default is 'open', it can be 'open' or 'close'.
* `ping_status` {string|null} - post ping status, default is 'open', it can be 'open' or 'close'.
* `type` {string|null} - product type. Options: 'simple', 'grouped', 'external' and 'variable'. Default is 'simple'.
* `status` {string|null} - product status (post status). Options: 'draft', 'pending', 'private' and 'publish'. Default is 'publish'.
* `password` {string|null} - password
* `categories` {array|string} - array or string representing product categories.
    If an array, it should be like ```{name: 'Top', slug: 'top'}, {name: 'Second'}]```.
    See addProductCategory() for possible attributes. Only 'name' attribute is mandatory.
    If your categories are represented as string, you can set a list of product categories keeping it's hierarchy like this:
    'Top > Middle > Sub', in this case 'Top' will be top category and have 'Middle' as it's child, 'Sub' is a child of 'Middle' and so on.
    Categories are added even if you haven't explicitly called addProductCategory.
    
* `attributes` {array} - array of product attributes. Every item should have at least 'name' and 'value' attributes.
    See addProductAttribute() for possible attributes.
    Attributes are added even if you haven't explicitly called addProductAttribute().

* `tags` {array} - array of product tags. Every element should have 'name' and 'slug' attributes.
* `images` {array} - array of urls or objects representing product images. See addAttachment for all possible attributes.
* `featured` {string|null} - Featured product. Default is 'no'.
* `catalog_visibility` {string|null} - Catalog visibility. Options: 'visible', 'catalog', 'search' and 'hidden'. Default is 'visible'.
* `sku` {string|null} - product unique identifier, SKU. Defaults to empty string.
* `regular_price` {number|null} - product price. Defaults to 0.00.
* `sale_price` {number|null} - product price while it is on sale. Defaults to empty string.
* `sale_price_dates_from` {Date|null} - date to start sale from. Defaults to empty string.
* `sale_price_dates_to` {Date|null} - date to stop sale. Defaults to empty string.
* `tax_status` {string|null} - product tax status. Defaults to 'taxable', more options: 'shipping' and 'none'.
* `tax_class` {string|null} - tax class.
* `reviews_allowed` {string|null} - Allow reviews. Default is 'true'.
* `manage_stock` {string|null} - Stock management at product level. Default is false.
* `backorders` {string|null} - If managing stock, this controls if backorders are allowed. Options: 'no', 'notify' and 'yes'. Default is 'no'.
* `sold_individually` {string|null} - Allow one item to be bought in a single order. Default is 'false'.
* `weight` {string|null} - product weight.
* `length` {string|null} - product length.
* `width` {string|null} - product width.
* `height` {string|null} - product height.
* `shipping_class` {string|null} - shipping class slug.
* `upsell_ids` {array|null} - array of ids of upsell products
* `crossell_ids` {array|null} - array of ids of crossell products
* `parent_id` {number|null} - Product parent ID.
* `purchase_note` {string|null} - Optional note to send the customer after purchase.
* `default_attributes` {array|null} - Array of default attributes.
* `grouped_products` {array|null} - Array of grouped products IDs.
* `menu_order` {number|null} - Menu order, used to custom sort products.
* `virtual` {string|null} - If the product is virtual. Default is 'no'.
* `downloadable` {string|null} - If the product is downloadable. Default is 'no'.
* `external_url` {string|null} - Product external URL. Only for external products.
* `button_text` {string|null} - Product external button text. Only for external products.
* `download_limit` {number|null} - Number of times downloadable files can be downloaded after purchase. Default is -1.
* `download_expiry` {number|null} - Number of days until access to downloadable files expires. Default is -1.
* `stock` {number|null} - stock quantity
* `stock_status` {string|null} - Controls the stock status of the product. Options: 'instock', 'outofstock', 'onbackorder'. Default is 'instock'.
* `downloadable_files` {array|null} - List of downloadable files.
* `price` {number|null} - price of product. Defaults to regular_price.
* `product_version` {string|null} - product generator version. Defaults to 3.9.2.
#####Example
```js
generator.addProduct({
    url: '',
    title: 'SECOND',
    author: 'wordpress',
    content: 'SUUUUUPER',
    downloadable: 'yes',
    summary: 'sUmMarY',
    categories: [{name: 'Super Category'}, {name: Second Category}], //In this case it's not hierarchycal
    attributes: [{name: 'size', value: '1'}, {name: 'color', value: '1'}],
    images: [{url: 'http://localhost/test/data/images/a8336254-c041-4988-9873-b9eb6ab03959.jpeg' }, {url: 'http://localhost/test/data/images/b2a39a1a-7639-4d35-9e4e-29e44753d1bd.jpeg'}],
});
generator.addProduct({
    url: '',
    title: 'TEST',
    author: 'wordpress',
    content: 'This is some product',
    regular_price: 9.99,
    downloadable: 'yes',
    summary: 'short description',
    categories: 'Top > Middle > Sub', //This IS hierarchycal
    attributes: [{name: 'size', value: '12'}, {name: 'weight', value: '4'}, {name: 'color', value: 'white'}],
    images: [{url: 'https://i.imgur.com/B21m40g.png' }, {url: 'https://i.imgur.com/0P6Z0I3.png' }],
});
```

####addPage(object)
__Adds product to the current position of document. Parameters are the same as of post. 
All of its categories and tags terms will be added above.__

The parameters are:
* `id` {number|null} - page Id, if not provided, random ID will be generated.
* `url` {string} - page permalink url.
* `date` {Date|null} - page create time. Defaults to current date and time.
* `title` {string} - page title.
* `slug` {string|null} - page slug name if it exists. If not, one will be generated from title.
* `author` {string|null} - page author, it equals author's login name. Defaults to 'wordpress'.
* `content` {string} - page content.
* `summary` {string} - page summary, short description.
* `comment_status` {string|null} - page comment status, default is 'open', it can be 'open' or 'close'.
* `ping_status` {string|null} - page ping status, default is 'open', it can be 'open' or 'close'.
* `status` {string|null} - page status. Can be 'publish', 'future', 'draft', 'pending', 'private', 'trash', 'auto-draft' and 'inherit'.
* `type` {string|null} - page type. Default is 'page' for pages.
* `password` {string|null} - page visit password if it should, default is empty.
* `categories` {array} - page categories, it's an array item. Every item should have 'slug' and 'name' prototype.
* `tags` {array} - page tags, it's an array item. Every item should have 'slug' and 'name' prototype.
* `imageID` {number|null} - ID of preloaded image hosted on YOUR website. Will be used as a thumbnail.
#####Example
```js
generator.addPage({
    url: 'http://localhost/terms-and-conditions-page/',
    title: 'Terms And Conditions',
    author: 'wordpress',
    content: fs.readFileSync(`./html/terms.html`),
    slug: 'terms-and-conditions-page',
    summary: '',
});
```

####addUser(object)
__Adds user to the current position of document.__

The parameters are:

* `id` {number|null}  - user ID. If none present, random ID will be generated.
* `username` {string}  - user login
* `email` {string}  - user email
* `display_name` {string}  - user nickname
* `first_name` {string|null}  - user first name. Defaults to empty string.
* `last_name` {string|null}  - user last name. Defaults to empty string.
#####Example
```js
generator.addUser({
    username: 'admin',
    email: 'test@test.net',
    display_name: 'Admin'
});
```

####addTag(object)
__Adds tag term to the current position of document.__

The parameters are:

* `id` {number|null}  - tag Id, if not provided, random ID will be generated.
* `slug` {string|null}  - tag slug. Used in URLS, e.g. "js-rocks". If not provided, it will be generated from name.
* `name` {string}  - tag title, e.g. "JS"
* `description` {string|null}  - tag description string, defaults to empty string.
#####Example
```js
generator.addTag({
   name: 'Post'
});
```

####addCategory(object)
__Adds category term to the current position of document.__

The parameters are:

* `id` {number|null}  - category Id. If not provided, random ID will be generated.
* `name` {string}  - category title, e.g. "Everything about JS"
* `slug` {string|null}  - category slug. Used in URLS, e.g. "js-rocks". If not provided, it will be generated from name.
* `parent_id` {number|null}  - category parent id if it exists.
* `description` {string|null}  - category description string, default is empty.

#####Example
```js
generator.addCategory({
   name: 'Post'
});
```

####addProductCategory(object)
__Adds product category term to the current position of document.__

__*You have to install and activate WooCommerce plugin before importing!*__

The parameters are:

* `id` {number|null}  - category Id. If not provided, random ID will be generated.
* `name` {string}  - category title, e.g. "Everything about JS"
* `slug` {string|null}  - category slug. Used in URLS, e.g. "js-rocks". If none present it will be generated from name.
* `parent_id` {number|null}  - category parent id if it existed.

#####Example
```js
generator.addProductCategory({
   name: 'Makeup'
});
```

####addProductAttribute(object)
__Adds product attribute term to the current position of document.__

__*You have to install and activate WooCommerce plugin before importing!*__

The parameters are:

* `id` {number|null}  - attribute ID. If none present, random ID will be generated.
* `name` {string}  - attribute name, e.g. 'Weight'.
* `value` {string}  - attribute value, e.g. '10 Kg'.
* `slug` {string|null}  - attribute slug, if none present, it will be generated from value.
* `taxonomy` {string|null}  - attribute taxonomy, if none present, it will be generated from name. E.G. 'pa_weight'
* `parent_id` {number|null}  - parent attribute id.

#####Example
```js
generator.addProductAttribute({
    name: 'Height',
    value: 'Tall'
});
```

####addAttachment(object)
__Adds attachment to the current position of document. This is used for importing media to posts, pages or products.__

The parameters are:

* `id` {number|null}  - attachment Id. If not provided, random ID will be generated.
* `url` {string}  - attachment absolute url.
* `date` {Date|null}  - attachment create time. Defaults to current date.
* `file` {string|null}  - attachment relative path if it exist.
* `title` {string}  - attachment title.
* `author` {string|null}  - attachment uploader. Defaults to 'wordpress'.
* `description` {string|null}  - attachment description. Defaults to empty string.
* `post_id` {number}  - post id relate to the attachment.
* `comment_status` {string|null}  - attachment comment status, default is 'open', it can be 'open' or 'closed'.
* `ping_status` {string|null}  - post ping status, default is 'open', it can be 'open' or 'closed'.
* `meta_data` {string|null}  - other serialized attach meta data.
* `attachment_type` {string|null}  - type of an attachment. Defaults to 'product_image'.
#####Example
```js
generator.addAttachment({
    url: 'https://i.imgur.com/B21m40g.png',
    title: 'Image',
    post_id: 0
});
```

####addMenu(object)
__Adds product attribute term to the current position of document.__
This is also called when you call addMenuItem, in case of menu doesn't exist.

The parameters are:

* `id` {number|null}  - menu ID. If not present, random ID will be generated.
* `slug` {string|null}  - menu slug. If not present, it will be generated from name.
* `name` {string}  - menu name.

#####Example
```js
generator.addMenu({
    name: 'MainMenu'
});
```

####addMenuItem(object)
__Adds menu item to the current position of document.__

__*You have to know the ID of something you are trying to add as menu item!*__

The parameters are:
* `id` {number|null} - menu item ID. If not present, random ID will be generated.
* `title` {string} - menu item title.
* `url` {string|null} - menu item url. Defaults to empty string.
* `date` {Date|null} - date of menu item publication. If none present, current date is used.
* `author` {string|null} - username of menu author. Defaults to 'wordpress'.
* `guid` {string}
* `content` {string|null} - menu item content. Defaults to empty string.
* `excerpt` {string|null} - menu item summary. Defaults to empty string.
* `status` {string|null} - menu item status (post status). Options: 'draft', 'pending', 'private' and 'publish'. Default is 'publish'.
* `parent` {number|null} - ID of parent menu item. Defaults to 0.
* `menu_order` {number|null} - position in menu. Defaults to 0.
* `password` {string|null} - menu item password
* `menu_name` {string} - name of menu to which this item will be added.
* `menu_item_object_id` {number} - ID of the category this item will be referencing.
* `menu_item_object` {string} - type of menu_item_object_id, usually 'product_cat'.
* `menu_item_type` {string|null} - type of menu item. Defaults to 'taxonomy'.
* `menu_item_menu_item_parent` {number|null} - parent of menu item. Defaults to 0.
* `menu_item_target` {string|null} - target of menu item. Defaults to empty string.
* `menu_item_classes` {array|null} - classes of menu item. Defaults to empty array.
* `menu_item_xfn` {string|null} - defaults to empty string
* `menu_item_url` {string|null} - defaults to empty string
#####Example
```js
//You have to know it's ID!!!
const categoryId = 999;
const id = generator.rId();

// add product category as menu item
generator.addMenuItem({
    id,
    author: 'wordpress', 
    url: `http://localhost/blog/${id}/`, 
    menu_name: 'MainMenu', //menu term will be added automatically in case you haven't added it first
    menu_item_object: 'product_cat', 
    menu_item_object_id: categoryId
});
```

##Forming the document

After you have called all of your methods that set something to add, you should use
```js
generator.stringify();
```
With or without following options:

* `pretty` {boolean}  - whether to pretty print the output or not. Defaults to false.
* `indent` {string}  - standard indentation. Defaults to four spaces.
* `newline` {string}  - new line character. Defaults to '\n'.

#####Example:
```js
fs.writeFileSync('./minified.xml', generator.stringify());
fs.writeFileSync('./pretty.xml', generator.stringify({ pretty: true }));
```

__Note that calling ```generator.generateWXR()``` will have no effect and will cause an error cause you are adding things directly into WXR instead of some kind of buffer to form the document later.__
