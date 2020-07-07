const xmlbuilder = require('xmlbuilder');

const PRODUCT_VERSION = '3.9.2';

/**
 * WXR generator.
 * Allows you to form Wordpress WXR document for importing posts, pages, categories, tags, menus, menu items, users
 * WooCommerce products, product categories and product attributes, media files for products and posts
 * @type {Generator}
 */
module.exports = class Generator {
    /** @type {array} */
    generatedIds = [];
    /** @type {array} */
    addedCategories = [];
    /** @type {array} */
    addedMenus = [];
    /** @type {object} */
    addedTags = {};
    /** @type {object} */
    addedProductCategories = {};
    /** @type {object} */
    addedProductAttributes = {};

    termsToAdd = [];
    postsToAdd = [];
    productsToAdd = [];
    menuItemsToAdd = [];
    attachmentsToAdd = [];
    usersToAdd = [];

    /**
     * Generates pseudo random ID.
     * @return {number}
     */
    rId = () => {
        let id = Math.floor(Math.random() * 100000);
        if (!this.generatedIds.includes(id)) {
            this.generatedIds.push(id);

            return id;
        }

        return this.rId();
    }

    /**
     * Class constructor.
     *
     * @param {string} name - site name
     * @param {string} url - site url
     * @param {string} description - site description
     * @param {string} language - site language, default is en-US
     * @param {string} base_site_url - base_site_url: same as url
     * @param {string} base_blog_url - base_blog_url: same as url
     */
    constructor({
        name,
        url,
        description,
        language = 'en-US',
        base_site_url = url,
        base_blog_url = url
    }) {
        this.xml = xmlbuilder.create('rss')
            .att('xmlns:excerpt', 'http://wordpress.org/export/1.2/expert')
            .att("xmlns:content", "http://purl.org/rss/1.0/modules/content/")
            .att("xmlns:wfw", "http://wellformedweb.org/CommentAPI/")
            .att("xmlns:dc", "http://purl.org/dc/elements/1.1/")
            .att("xmlns:wp", "http://wordpress.org/export/1.2/")
            .att("version", "2.0");
        this.channel = this.xml.ele('channel');
        this.channel.ele('wp:wxr_version', {}, 1.2);
        this.channel.ele('title', {}, name);
        this.channel.ele('link', {}, url);
        this.channel.ele('description', {}, description);
        this.channel.ele('language', {}, language);
        this.channel.ele('wp:base_site_url', {}, base_site_url);
        this.channel.ele('wp:base_blog_url', {}, base_blog_url);
        this.channel.ele('generator', {}, 'https://npmjs.com/wxr-generator');
    }

    /**
     * Sets term to add to the beginning of document
     * @see addCategory
     * @see addProductCategory
     * @see addProductAttribute
     * @see addTag
     * @param {object} term
     * @return Generator
     */
    setTermToAdd(term) {
        if (!term.hasOwnProperty('id')) {
            term.id = this.rId();
        }
        const termExists = this.termsToAdd.some((item) => {
            if (term.type === 'product_attribute') {
                return (item.name === term.name && item.value === term.value);
            } else {
                if (term.type === 'category' && this.addedCategories.hasOwnProperty(term.name)) {
                    return true;
                }
                if (term.type === 'product_cat' && this.addedProductCategories.hasOwnProperty(term.name)) {
                    return true;
                }
                if (term.type === 'nav_menu' && this.addedMenus.hasOwnProperty(term.name)) {
                    return true;
                }
                if (term.type === 'tag' && this.addedTags.hasOwnProperty(term.name)) {
                    return true;
                }
                return item.name === term.name;
            }
        });

        if (!termExists) {
            this.termsToAdd.push(term);
        }

        return this;
    }

    /**
     * Sets menu to add to the document
     * @see addMenu
     * @param {object} menu
     * @return Generator
     */
    setMenuToAdd(menu) {
        menu.type = 'nav_menu';

        return this.setTermToAdd(menu);
    }

    /**
     * Sets menu item to add to the document
     * @see addMenuItem
     * @param {object} menuItem
     * @return Generator
     */
    setMenuItemToAdd(menuItem) {
        if (!menuItem.hasOwnProperty('id')) {
            menuItem.id = this.rId();
        }
        let menu_name = menuItem.menu_name;
        let slug = this.generateSlug(menu_name);
        this.setMenuToAdd({name: menu_name, slug})

        const menuItemExists = this.menuItemsToAdd.some((item) => item.title === menuItem.title);
        if (!menuItemExists) {
            this.menuItemsToAdd.push(menuItem);
        }

        return this;
    }

    /**
     * Sets post to add to the  document
     * @see addPost
     * @param {object} post
     * @return Generator
     */
    setPostToAdd(post) {
        if (Array.isArray(post.tags)) {
            post.tags.forEach(tag => {
                tag.type = 'tag';
                this.setTermToAdd(tag);
            });
        }
        if (Array.isArray(post.categories)) {
            post.categories.forEach(cate => {
                cate.type = 'category';
                this.setTermToAdd(cate);
            });
        }
        if (!post.hasOwnProperty('id')) {
            post.id = this.rId();
        }
        const postExists = this.postsToAdd.some((item) => item.id === post.id);
        if (!postExists) {
            this.postsToAdd.push(post);
        }

        return this;
    }

    /**
     * Sets page to add to the document.
     * @see addPage
     * @param {object} page
     * @return {Generator}
     */
    setPageToAdd(page) {
        page.type = 'page';

        return this.setPostToAdd(page);
    }

    /**
     * Sets product to ad to the document.
     * @see addProduct
     * @param {object} product
     * @return {Generator}
     */
    setProductToAdd(product) {
        let images = product.images;
        if (Array.isArray(images)) {
            if (typeof images[0] === 'string') {
                images = images.map((image) => {
                    const id = this.rId();
                    const title = image.split('/').pop().replace(/\?.*/, '');
                    this.setAttachmentToAdd({id, title, url: image});
                    return {id, title, url: image};
                });
            } else if (typeof images[0] === 'object') {
                images = images.map((image) => {
                    const id = image.id || this.rId();
                    const url = image.url;
                    const title = image.title || url.split('/').pop().replace(/\?.*/, '');
                    this.setAttachmentToAdd({id, title, url});
                    return {id, title, url};
                });
            }

            product.images = images;
        }
        let tags = product.tags;
        if (Array.isArray(tags)) {
            tags.forEach(tag => {
                if (typeof tag === 'string') {
                    tag = {name: tag};
                }
                tag.type = 'tag';
                this.setTermToAdd(tag);
            });
        }

        let categories = product.categories;
        if (Array.isArray(categories)) {
            categories.forEach(cate => {
                if (typeof cate === 'string') {
                    cate = {name: cate};
                }
                cate.type = 'product_cat';
                this.setTermToAdd(cate);
            });
        } else if (typeof categories === 'string' && categories.indexOf(' > ') !== -1) {
            categories = categories.split(' > ');
            let cats = categories.map((el) => { return {name: el}; });

            cats.reduce((carry, cate) => {
                let slug = this.generateSlug(cate.name);
                this.setTermToAdd({id: this.rId(), name: cate.name, parent_id: carry, slug, type: 'product_cat'});
                return slug;
            }, 0);
        }
        let attributes = product.attributes;
        if (Array.isArray(attributes)) {
            attributes.forEach(attr => {
                this.setTermToAdd({name: attr.name, value: attr.value, type: 'product_attribute'});
            });
        }

        if (!product.hasOwnProperty('id')) {
            product.id = this.rId();
        }

        const productExists = this.productsToAdd.some((item) => item.id === product.id);
        if (!productExists) {
            this.productsToAdd.push(product);
        }

        return this;
    }

    /**
     * Sets attachment to add to the end of document
     * @see addAttachment
     * @param {object} attachment
     * @return Generator
     */
    setAttachmentToAdd(attachment) {
        if (!attachment.hasOwnProperty('id')) {
            attachment.id = this.rId();
        }

        const attachmentExists = this.attachmentsToAdd.some((item) => item.title === attachment.title)
        if (!attachmentExists) {
            this.attachmentsToAdd.push(attachment);
        }

        return this;
    }

    /**
     * Sets user to add to the beginning of document.
     * @see addUser
     * @param {object} user
     * @return {Generator}
     */
    setUserToAdd(user) {
        const userExists = this.usersToAdd.some((item) => item.name === user.name)
        if (!userExists) {
            this.usersToAdd.push(user);
        }

        return this;
    }

    /**
     * Adds a post.
     * @param {number} id - post Id, if not provided, random ID will be generated.
     * @param {string} url - post permalink url.
     * @param {Date} date - post create time. Default current date and time.
     * @param {string} title - post title.
     * @param {string} slug - post slug name if it exists. If not, one will be generated from title.
     * @param {string} author - post author, it equals author's login name.
     * @param {string} content - post content.
     * @param {string} summary - post summary, short description.
     * @param {string} comment_status - post comment status, default is `open`, it can be `open` or `close`.
     * @param {string} ping_status - post ping status, default is `open`, it can be `open` or `close`.
     * @param {string} status - post status. Can be 'publish', 'future', 'draft', 'pending', 'private', 'trash', 'auto-draft' and 'inherit'.
     * @param {string} type - post type. Default is 'post' for posts.
     * @param {string} password - post visit password if it should, default is empty.
     * @param {array} categories - post categories, it's an array item. Every item should has `slug` and `name` prototype.
     * @param {array} tags - post tags, it's an array item. Every item should has `slug` and `name` prototype.
     * @param {number} imageID - ID of preloaded image hosted on YOUR website. Will be used as a thumbnail.
     * @return {Generator}
     */
    addPost({
        id = this.rId(),
        url,
        date = new Date(),
        title,
        slug = this.generateSlug(title),
        author,
        content,
        summary,
        comment_status = 'open',
        ping_status = 'open',
        status = 'publish',
        type = 'post',
        password = '',
        categories,
        tags,
        imageID
    }) {
        if (Array.isArray(tags)) {
            tags.forEach(tag => {
                const name = tag.name;
                const tagIsInQueue = this.termsToAdd.some((item) => item.name === name);
                if (!tagIsInQueue) {
                    this.addTag(tag);
                }
            });
        }
        if (Array.isArray(categories)) {
            categories.forEach(cate => {
                const name = cate.name;
                const categoryIsInQueue = this.termsToAdd.some((item) => item.name === name);
                if (!categoryIsInQueue) {
                    this.addCategory(cate);
                }
            });
        }
        let post = this.channel.ele('item');
        post.ele('title', {}, title);
        post.ele('link', {}, url);
        post.ele('pubDate', {}, date.toUTCString());
        post.ele('dc:creator').cdata(author);
        post.ele('guid', {isPermaLink: true}, slug);
        post.ele('description').cdata(summary);
        post.ele('content:encoded').cdata(content);
        post.ele('excerpt:encoded').cdata(summary);
        post.ele('wp:post_id', {}, id);
        post.ele('wp:post_date').cdata(date.toISOString());
        post.ele('wp:comment_status').cdata(comment_status);
        post.ele('wp:ping_status').cdata(ping_status);
        post.ele('wp:post_name').cdata(slug);
        post.ele('wp:status').cdata(status);
        post.ele('wp:post_parent', {}, 0);
        post.ele('wp:menu_order', {}, 0);
        post.ele('wp:post_type', {}, type);
        post.ele('wp:post_password').cdata(password);
        post.ele('wp:is_sticky', {}, 0);
        if (Array.isArray(categories)) {
            categories.forEach(cate => {
                post.ele('category', {
                    domain: 'category',
                    nicename: cate.slug
                }).cdata(cate.name)
            });
        }
        if (Array.isArray(tags)) {
            tags.forEach(tag => post.ele('category', {
                domain: 'category',
                nicename: tag.slug
            }).cdata(tag.name));
        }
        if (imageID && Number.isInteger(imageID)) {
            post.ele({
                'wp:postmeta': [{
                    'wp:meta_key': '_thumbnail_id',
                    'wp:meta_value': imageID
                }]
            });
        }

        return this;
    }

    /**
     *
     * Adds a product. WARNING: your WordPress website should have WooCommerce plugin activated.
     *
     * @param {number} id - product Id, if not provided, random ID will be generated.
     * @param {string} url - product permalink url.
     * @param {string} title - product title.
     * @param {string} slug - product slug. If none present, it will be generated from title.
     * @param {Date} date - product publication date.
     * @param {string} author - product author, it equals author's login name.
     * @param {string} content - product description.
     * @param {string} summary - product description summary.
     * @param {string} comment_status - post comment status, default is `open`, it can be `open` or `close`.
     * @param {string} ping_status - post ping status, default is `open`, it can be `open` or `close`.
     * @param {string} type - product type. Options: 'simple', 'grouped', 'external' and 'variable'. Default is 'simple'.
     * @param {string} status - product status (post status). Options: 'draft', 'pending', 'private' and 'publish'. Default is 'publish'.
     * @param {string} password - password
     * @param {array|string} categories - array or string representing product categories.
     *  If an array, it should be like [{name: 'Top', slug: 'top'}, {name: 'Second'}].
     *  @see addProductCategory() for possible attributes. Only 'name' attribute is mandatory.
     *  If your categories are represented as string, you can set a list of product categories keeping it's hierarchy like this:
     *  'Top > Middle > Sub', in this case 'Top' will be top category and have 'Middle' as it's child, 'Sub' is a child of 'Middle' and so on.
     *  Categories are added even if you haven't explicitly called addProductCategory.
     *
     * @param {array} attributes - array of product attributes. Every item should have at least 'name' and 'value' attributes.
     *  @see addProductAttribute() for possible attributes.
     *  Attributes are added even if you haven't explicitly called addProductAttribute().
     *
     * @param {array} tags - array of product tags. Every element should have 'name' and 'slug' attributes.
     * @param {array} images - array of urls or objects representing product images.
     *  @see addAttachment for all possible attributes.
     * @param {string} featured - Featured product. Default is false.
     * @param {string} catalog_visibility - Catalog visibility. Options: 'visible', 'catalog', 'search' and 'hidden'. Default is 'visible'.
     * @param {string} sku - product unique identifier, SKU
     * @param {number} regular_price - product price.
     * @param {number|''} sale_price - product price while it is on sale.
     * @param {Date|''} sale_price_dates_from - date to start sale from.
     * @param {Date|''} sale_price_dates_to - date to stop sale.
     * @param {string} tax_status - product tax status. Defaults to 'taxable', more options: 'shipping' and 'none'.
     * @param {string|null} tax_class - tax class.
     * @param {string} reviews_allowed - Allow reviews. Default is 'true'.
     * @param {string} manage_stock - Stock management at product level. Default is false.
     * @param {string} backorders - If managing stock, this controls if backorders are allowed. Options: 'no', 'notify' and 'yes'. Default is 'no'.
     * @param {string} sold_individually - Allow one item to be bought in a single order. Default is 'false'.
     * @param {string} weight - product weight.
     * @param {string} length - product length.
     * @param {string} width - product width.
     * @param {string} height - product height.
     * @param {string} shipping_class - shipping class slug.
     * @param {array} upsell_ids - array of ids of upsell products
     * @param {array} crossell_ids - array of ids of crossell products
     * @param {number} parent_id - Product parent ID.
     * @param {string} purchase_note - Optional note to send the customer after purchase.
     * @param {array} default_attributes - Array of default attributes.
     * @param {array} grouped_products - Array of grouped products IDs.
     * @param {number} menu_order - Menu order, used to custom sort products.
     * @param {string} virtual - If the product is virtual. Default is 'no'.
     * @param {string} downloadable - If the product is downloadable. Default is 'no'.
     * @param {string} external_url - Product external URL. Only for external products.
     * @param {string} button_text - Product external button text. Only for external products.
     * @param {number} download_limit - Number of times downloadable files can be downloaded after purchase. Default is -1.
     * @param {number} download_expiry - Number of days until access to downloadable files expires. Default is -1.
     * @param {number} stock - stock quantity
     * @param {string} stock_status - Controls the stock status of the product. Options: 'instock', 'outofstock', 'onbackorder'. Default is 'instock'.
     * @param {array} downloadable_files - List of downloadable files.
     * @param {number} price - price of product. Defaults to regular_price.
     * @param {string} product_version - product generator version.
     *  @see PRODUCT_VERSION for default value.
     * @return {Generator}
     */
    addProduct({
        id = this.rId(),
        url,
        title,
        slug = this.generateSlug(title),
        date = new Date(),
        author,
        content,
        summary,
        comment_status = 'open',
        ping_status = 'closed',
        type = 'simple',
        status = 'publish',
        password = '',
        categories,
        attributes,
        tags,
        images,

        featured = 'no',
        catalog_visibility = 'visible',
        sku = '',
        regular_price = 0.00,
        sale_price = '',
        sale_price_dates_from = '',
        sale_price_dates_to = '',
        tax_status = 'taxable',
        tax_class = null,
        reviews_allowed = 'yes',
        manage_stock = 'yes',
        backorders = 'no',
        sold_individually = 'no',
        weight = '',
        length = '',
        width = '',
        height = '',
        shipping_class = '',
        upsell_ids = [],
        crossell_ids = [],
        parent_id = 0,
        purchase_note = '',
        default_attributes = [],
        grouped_products = [],
        menu_order = 0,
        virtual = 'no',
        downloadable = 'no',
        download_limit = -1,
        download_expiry = -1,
        external_url = '',
        button_text = '',
        stock = 1,
        stock_status = 'instock',
        downloadable_files = [],
        price = regular_price,
        product_version = PRODUCT_VERSION
    }) {
        if (Array.isArray(images)) {
            if (typeof images[0] === 'string') {
                images = images.map((image) => {
                    const id = this.rId();
                    const title = image.split('/').pop().replace(/\?.*/, '');
                    return {id, title, url: image};
                });
            } else if (typeof images[0] === 'object') {
                images = images.map((image) => {
                    const id = image.id || this.rId();
                    const url = image.url;
                    const title = image.title || url.split('/').pop().replace(/\?.*/, '');
                    return {id, title, url};
                });
            }
        }
        if (Array.isArray(tags)) {
            tags.forEach(tag => {
                if (typeof tag === 'string') {
                    tag = {name: tag};
                }
                const tagExists = this.termsToAdd.some((item) => item.name === tag.name);
                if (!tagExists) {
                    this.addTag(tag);
                }
            });
        }
        if (Array.isArray(categories)) {
            categories.forEach(cate => {
                if (typeof cate === 'string') {
                    cate = {name: cate};
                }
                const categoryExists = this.termsToAdd.some((item) => item.name === cate.name);
                if (!categoryExists) {
                    this.addProductCategory(cate);
                }
            });
        } else if (typeof categories === 'string' && categories.indexOf(' > ') !== -1) {
            categories = categories.split(' > ');
            let cats = categories.map((el) => { return {name: el}; });

            cats.reduce((carry, cate) => {
                let slug = this.generateSlug(cate.name);
                const categoryExists = this.termsToAdd.some((item) => item.name === cate.name);
                if (!categoryExists) {
                    this.addProductCategory({id: this.rId(), name: cate.name, parent_id: carry, slug, type: 'product_cat'});
                }
                return slug;
            }, 0)
        }
        if (Array.isArray(attributes)) {
            attributes.forEach(attr => {
                const attributeExists = this.termsToAdd.some((item) => item.name === attr.name && item.value === attr.value);
                if (!attributeExists) {
                    this.addProductAttribute({name: attr.name, value: attr.value, type: 'product_attribute'});
                }
            });
        }
        let product = this.channel.ele('item');
        product.ele('title', {}, title);
        product.ele('link', {}, url);
        product.ele('pubDate', {}, date.toUTCString());
        product.ele('dc:creator').cdata(author);
        product.ele('guid', {isPermaLink: true}, slug);
        product.ele('description').cdata(summary);
        product.ele('content:encoded').cdata(content);
        product.ele('excerpt:encoded').cdata(summary);
        product.ele('wp:post_id', {}, id);
        product.ele('wp:post_date').cdata(date.toISOString());
        product.ele('wp:comment_status').cdata(comment_status);
        product.ele('wp:ping_status').cdata(ping_status);
        product.ele('post_name').cdata(title);
        product.ele('wp:status').cdata(status);
        product.ele('wp:post_parent', {}, 0);
        product.ele('wp:menu_order', {}, 0);
        product.ele('wp:post_type').cdata('product');
        product.ele('wp:post_password').cdata(password);
        product.ele('wp:is_sticky', {}, 0);

        let attrCData = false;
        if (Array.isArray(attributes)) {
            attributes.forEach(attr => {
                const name = attr.name;
                const value = attr.value;
                product.ele('category', {
                    domain: 'pa_' + this.generateTaxonomy(name),
                    nicename: this.generateSlug(value)
                }).cdata(value);
            });

            attrCData = this.generateAttributesCData(attributes);
        }
        if (Array.isArray(categories)) {
            categories.forEach(cate => {
                if (typeof cate === 'string') {
                    cate = {name: cate};
                }
                const name = cate.name;
                if (!cate.hasOwnProperty('slug')) {
                    cate.slug = this.generateSlug(name);
                }
                product.ele('category', {
                    domain: 'product_cat',
                    nicename: cate.slug
                }).cdata(name)
            });
        }

        product.ele('category', {
            domain: 'product_type',
            nicename: type
        }).cdata(type);

        if (Array.isArray(tags)) {
            tags.forEach(tag => product.ele('category', {
                domain: 'category',
                nicename: tag.slug
            }).cdata(tag.name));
        }

        if (attrCData !== false) {
            let attrCDataBlock = product.ele('wp:postmeta');
            attrCDataBlock.ele('wp:meta_key').cdata('_product_attributes');
            attrCDataBlock.ele('wp:meta_value').cdata(attrCData);
        }
        if (Array.isArray(default_attributes)) {
            let attrCDataBlock = product.ele('wp:postmeta');
            attrCDataBlock.ele('wp:meta_key').cdata('_default_attributes');
            attrCDataBlock.ele('wp:meta_value').cdata(this.generateAttributesCData(default_attributes));
        }

        let stats = {featured, catalog_visibility, sku, regular_price, sale_price, sale_price_dates_from,
            sale_price_dates_to, tax_status, tax_class, reviews_allowed, parent_id,
            manage_stock, backorders, sold_individually, weight, length, width, height, shipping_class, upsell_ids,
            crossell_ids, purchase_note, grouped_products, menu_order, virtual, downloadable, external_url, button_text,
            download_limit, download_expiry, stock, stock_status, downloadable_files, price, product_version};

        for (const stat of Object.entries(stats)) {
            const statName = stat[0];
            let statValue = stat[1];
            const postMetaBlock = product.ele('wp:postmeta');
            postMetaBlock.ele('wp:meta_key').cdata(`_${statName}`);
            let valBlock = postMetaBlock.ele('wp:meta_value');
            if (typeof statValue !== 'undefined' && statValue !== null) {
                if (Array.isArray(statValue)) {
                    statValue = this.generateCDataArray(statValue);
                }
                valBlock.cdata(statValue);
            }
        }

        if (Array.isArray(images)) {
            let imgs = images.map(item => item.id);
            product.ele({
                'wp:postmeta': [{
                    'wp:meta_key': '_thumbnail_id',
                    'wp:meta_value': imgs.shift()
                }]
            });
            if (imgs.length > 0) {
                let postMetaBlock = product.ele('wp:postmeta');
                postMetaBlock.ele('wp:meta_key').cdata('_product_image_gallery');
                postMetaBlock.ele('wp:meta_value').cdata(imgs.join(','));
            }
        }

        if (typeof images === 'number') {
            product.ele({
                'wp:postmeta': [{
                    'wp:meta_key': '_thumbnail_id',
                    'wp:meta_value': images
                }]
            });
        }

        if (Array.isArray(images)) {
            for (const image of images) {
                const attachmentExists = this.attachmentsToAdd.some((item) => item.title === image.title);
                if (!attachmentExists) {
                    this.addAttachment({author: author, ...image});
                }
            }
        }

        return this;
    }

    /**
     * Adds page.
     *
     * @param {object} page
     * @return {Generator}
     */
    addPage(page) {
        page.type = 'page';
        this.addPost(page);

        return this;
    }

    /**
     * Adds user.
     *
     * @param {number} id - user ID. If none present, random ID will be generated.
     * @param {string} username - user login
     * @param {string} email - user email
     * @param {string} display_name - user nickname
     * @param {string} first_name - user first name
     * @param {string} last_name - user last name
     * @return {Generator}
     */
    addUser({
        id = this.rId(),
        username,
        email,
        display_name,
        first_name = '',
        last_name = ''
    }) {
        let user = this.channel.ele('wp:author');
        user.ele('wp:author_id', {}, id);
        user.ele('wp:author_login', {}, username);
        user.ele('wp:author_email', {}, email);
        user.ele('wp:author_display_name', {}, display_name || username);
        user.ele('wp:author_first_name', {}, first_name);
        user.ele('wp:author_last_name', {}, last_name);

        return this;
    }

    /**
     * Adds tag.
     *
     * @param {number} id - tag Id, if not provided, random ID will be generated.
     * @param {string} slug - tag slug. Used in URLS, e.g. "js-rocks". If not provided, it will be generated from name.
     * @param {string} name - tag title, e.g. "JS"
     * @param {string} description - tag description string, default is empty.
     * @return {Generator}
     */
    addTag({id = this.rId(), name, slug = this.generateSlug(name), description = ''}) {
        let tag = this.channel.ele('wp:tag');
        tag.ele('wp:term_id', {}, id);
        tag.ele('wp:tag_slug', {}, slug);
        tag.ele('wp:tag_name', {}, name);
        tag.ele('wp:tag_description', {}, description);

        return this;
    }

    /**
     * Adds category.
     *
     * @param {number} id - category Id. If not provided, random ID will be generated.
     * @param {string} name - category slug. Used in URLS, e.g. "js-rocks"
     * @param {string} slug - category title, e.g. "Everything about JS"
     * @param {number} parent_id - category parent id if it existed.
     * @param {string} description - category description string, default is empty.
     * @return {Generator}
     */
    addCategory({
        id = this.rId(),
        name,
        slug = this.generateSlug(name),
        parent_id = 0,
        description = ''
    }) {
        let category = this.channel.ele('wp:category');
        category.ele('wp:term_id', {}, id);
        category.ele('wp:category_nicename', {}, slug);
        category.ele('wp:cat_name', {}, name);
        category.ele('wp:category_description', {}, '');
        if (parent_id) {
            category.ele('wp:category_parent', {}, parent_id);
        }
        this.addedCategories.push(name);

        return this;
    }

    /**
     * Adds product category term.
     *
     * @param {number} id - category Id. If not provided, random ID will be generated.
     * @param {string} name - category title, e.g. "Everything about JS"
     * @param {string} slug - category slug. Used in URLS, e.g. "js-rocks". If none present it will be generated from name.
     * @param {number} parent_id - category parent id if it existed.
     * @return {Generator}
     */
    addProductCategory({
       id = this.rId(),
       name,
       slug = this.generateSlug(name),
       parent_id = 0
    }) {
        if (!this.addedProductCategories.hasOwnProperty(name)) {
            let attribute = this.channel.ele('wp:term');
            attribute.ele('wp:term_id').cdata(id);
            attribute.ele('wp:term_taxonomy').cdata('product_cat');
            attribute.ele('wp:term_slug').cdata(slug);
            attribute.ele('wp:term_name').cdata(name);
            if (parent_id) {
                attribute.ele('wp:term_parent').cdata(parent_id);
            }
            this.addedProductCategories[name] = id;
        }

        return this;
    }

    /**
     * Adds product attribute term.
     *
     * @param {number} id - attribute ID. If none present, random ID will be generated.
     * @param {string} name - attribute name, e.g. 'Weight'.
     * @param {string} value - attribute value, e.g. '10 Kg'.
     * @param {string} slug - attribute slug, if none present, it will be generated from value.
     * @param {string} taxonomy - attribute taxonomy, if none present, it will be generated from name. E.G. 'pa_weight'
     * @param {number} parent_id - parent attribute id.
     * @return {Generator}
     */
    addProductAttribute({
        id = this.rId(),
        name,
        value,
        slug = this.generateSlug(value),
        taxonomy = 'pa_' + this.generateTaxonomy(name),
        parent_id = 0
    }) {
        if (!this.addedProductAttributes.hasOwnProperty('key')) {
            this.addedProductAttributes[name] = [];
        }
        if (!this.addedProductAttributes[name].includes(value)) {
            let attribute = this.channel.ele('wp:term');
            attribute.ele('wp:term_id').cdata(id);
            attribute.ele('wp:term_taxonomy').cdata(taxonomy);
            attribute.ele('wp:term_slug').cdata(slug);
            attribute.ele('wp:term_name').cdata(value);
            if (parent_id) {
                attribute.ele('wp:term_parent').cdata(parent_id);
            }
            this.addedProductAttributes[name].push(value);
        }
        return this;
    }

    /**
     * Adds media file to post.
     *
     * @param {number} id - attachment Id. If not provided, random ID will be generated.
     * @param {string} url - attachment absolute url.
     * @param {Date} date - attachment create time.
     * @param {string} file - attachment relative path if it exist.
     * @param {string} title - attachment title.
     * @param {string} author - attachment uploader.
     * @param {string} description - attachment description.
     * @param {number} post_id - post id relate to the attachment.
     * @param {string} comment_status - attachment comment status, default is `open`, it can be `open` or `closed`.
     * @param {string} ping_status - post ping status, default is `open`, it can be `open` or `closed`.
     * @param {string} meta_data - other serialized attach meta data.
     * @param {string} attachment_type - type of an attachment.
     * @return {Generator}
     */
    addAttachment({
        id = this.rId(),
        url,
        date = new Date(),
        file,
        title,
        author = 'admin',
        description = '',
        post_id,
        comment_status = 'open',
        ping_status = 'closed',
        meta_data,
        attachment_type = 'product_image'
    }) {
        let attach = this.channel.ele('item');
        attach.ele('title', {}, title);
        attach.ele('link', {}, url);
        attach.ele('pubDate', {}, date.toUTCString());
        attach.ele('dc:creator', {}, author);
        attach.ele('guid', {isPermaLink: false}, url);
        attach.ele('description').cdata(description);
        attach.ele('content:encoded').cdata(description);
        attach.ele('excerpt:encoded').cdata(description);
        attach.ele('wp:post_id', {}, id);
        attach.ele('wp:post_date', {}, date.toISOString());
        attach.ele('wp:comment_status').cdata(comment_status);
        attach.ele('wp:ping_status').cdata(ping_status);
        attach.ele('wp:post_name').cdata(this.generateSlug(title));
        attach.ele('wp:status').cdata('inherit');
        attach.ele('wp:post_parent', {}, post_id);
        attach.ele('wp:menu_order', {}, 0);
        attach.ele('wp:post_type', {}, 'attachment');
        attach.ele('wp:post_password').cdata('');
        attach.ele('wp:is_sticky', {}, 0);
        attach.ele('wp:attachment_url').cdata(url);
        if (attachment_type === 'product_image') {
            let postMetaBlock = attach.ele('wp:postmeta');
            postMetaBlock.ele('wp:meta_key', {}, '_wc_attachment_source');
            postMetaBlock.ele('wp:meta_value').cdata(url);
        }
        if (typeof file !== 'undefined') {
            attach.ele({
                'wp:postmeta': [
                    {
                        'wp:meta_key': '_wp_attached_file',
                        'wp:meta_value': file
                    },
                    {
                        'wp:meta_key': '_wp_attachment_metadata',
                        'wp:meta_value': meta_data
                    },
                    {
                        'wp:meta_key': '_wp_attachment_image_alt',
                        'wp:meta_value': title
                    }
                ]
            });
        }

        return this;
    }

    /**
     * Adds menu term.
     *
     * @param {number} id - menu ID. If not present, random ID will be generated.
     * @param {string} slug - menu slug. If not present, it will be generated from name.
     * @param {string} name - menu name.
     * @return {Generator}
     */
    addMenu({id = this.rId(), name, slug = this.generateSlug(name)}) {
        if (!this.addedMenus.includes(name)) {
            let menu = this.channel.ele('wp:term');
            menu.ele('wp:term_id', {}, id);
            menu.ele('wp:term_taxonomy', {}, 'nav_menu');
            menu.ele('wp:term_slug').cdata(slug);
            menu.ele('wp:term_name').cdata(name);
            this.addedMenus.push(name);
        }
        return this;
    }

    /**
     * Adds menu item.
     *
     * @param id - menu item ID. If not present, random ID will be generated.
     * @param {string} title - menu item title.
     * @param {string} url - menu item url.
     * @param {Date} date - date of menu item publication.
     * @param {string} author - username of menu author.
     * @param {string} guid
     * @param {string} content - menu item content.
     * @param {string} excerpt - menu item summary.
     * @param {string} status - menu item status (post status). Options: 'draft', 'pending', 'private' and 'publish'. Default is 'publish'.
     * @param {number} parent - ID of parent menu item.
     * @param {number} menu_order - position in menu. Defaults to 0.
     * @param {string} password - menu item password
     * @param {string} menu_name - name of menu to which this item will be added.
     * @param {number} menu_item_object_id - ID of the category this item will be referencing.
     * @param {string} menu_item_object - type of menu_item_object_id, usually 'product_cat'.
     * @param {string} menu_item_type - type of menu item
     * @param {number} menu_item_menu_item_parent - parent of menu item
     * @param {string} menu_item_target - target of menu item
     * @param {array} menu_item_classes - classes of menu item
     * @param {string} menu_item_xfn
     * @param {string} menu_item_url
     * @return {Generator}
     */
    addMenuItem({
        id = this.rId(),
        title = this.generateSlug(id),
        url = '',
        date = new Date(),
        author,
        guid,
        content = '',
        excerpt = '',
        status = 'publish',
        parent = 0,
        menu_order = 0,
        password = '',
        menu_name,
        menu_item_object_id,
        menu_item_object,
        menu_item_type = 'taxonomy',
        menu_item_menu_item_parent = 0,
        menu_item_target = '',
        menu_item_classes = [],
        menu_item_xfn = '',
        menu_item_url = '',
    }) {
        let slug = this.generateSlug(menu_name);
        if (!this.addedMenus.includes(menu_name)) {
            this.addMenu({name: menu_name, slug});
        }
        let menuItem = this.channel.ele('item');
        menuItem.ele('title', {}, title);
        menuItem.ele('link', {}, url);
        menuItem.ele('pubDate', {}, date.toUTCString());
        menuItem.ele('dc:creator').cdata(author);
        menuItem.ele('guid', {isPermaLink: false}, guid);
        menuItem.ele('description').cdata(excerpt);
        menuItem.ele('content:encoded').cdata(content);
        menuItem.ele('excerpt:encoded').cdata(excerpt);
        menuItem.ele('wp:post_id', {}, id);
        menuItem.ele('wp:post_date').cdata(date.toISOString());
        menuItem.ele('wp:comment_status').cdata('closed');
        menuItem.ele('wp:ping_status').cdata('closed');
        menuItem.ele('post_name').cdata(title);
        menuItem.ele('wp:status').cdata(status);
        menuItem.ele('wp:post_parent', {}, parent);
        menuItem.ele('wp:menu_order', {}, menu_order);
        menuItem.ele('wp:post_type').cdata('nav_menu_item');
        menuItem.ele('wp:post_password').cdata(password);
        menuItem.ele('wp:is_sticky', {}, 0);
        menuItem.ele('category', {
            domain: 'nav_menu',
            nicename: slug
        }).cdata(menu_name);

        let attrs = {
            menu_item_type, menu_item_menu_item_parent, menu_item_object_id, menu_item_object, menu_item_target,
            menu_item_classes, menu_item_xfn, menu_item_url,
        };

        for (const stat of Object.entries(attrs)) {
            const statName = stat[0];
            let statValue = stat[1];
            const postMetaBlock = menuItem.ele('wp:postmeta');
            postMetaBlock.ele('wp:meta_key').cdata(`_${statName}`);
            let valBlock = postMetaBlock.ele('wp:meta_value');
            if (typeof statValue !== 'undefined' && statValue !== null) {
                if (Array.isArray(statValue)) {
                    statValue = this.generateCDataArray(statValue);
                }
                valBlock.cdata(statValue);
            }
        }

        return this;
    }

    /**
     * Generates slug for name.
     *
     * @param {string|number} name
     * @return {string}
     */
    generateSlug(name) {
        return name.toString().toLowerCase().replace(/[^a-z0-9]/gmi, ' ').replace(/\s+/g, '-');
    }

    /**
     * Generates taxonomy for name.
     *
     * @param {string|number} name
     * @return {string}
     */
    generateTaxonomy(name) {
        return name.toString().toLowerCase().replace(/[^a-z0-9]/gmi, ' ').replace(/\s+/g, '_');
    }

    /**
     * Generates CData encoded array notation.
     *
     * @param {array} arr
     * @return {string}
     */
    generateCDataArray(arr) {
        const arrLen = arr.length;
        let cData = '';
        for (let i = 0; i < arrLen; i++) {
            cData += `i:${i};i:${arr[i]};`;
        }
        return `a:${arrLen}:{${cData}}`;
    }

    /**
     * Generates CData encoded array notation string for attributes.
     *
     * @param {array} attributes
     * @return {string}
     */
    generateAttributesCData(attributes) {
        let attrCData = [];
        attributes.forEach(attr => {
            const key = attr.name;
            let attrTaxonomy;
            if (key.indexOf(' ') !== -1 || key.indexOf('_') === -1) {
                attrTaxonomy = 'pa_' + this.generateTaxonomy(key);
            }
            let b = [];
            attr = {
                name: attr.name,
                value: attr.value,
                position: attr.position || '0',
                is_visible: attr.is_visible || '1',
                is_variation: attr.is_variation || '0',
                is_taxonomy: 1
            };
            for (let key in attr) {
                if (attr.hasOwnProperty(key)) {
                    let keyLen = key.length || key.toString().length;
                    let val = attr[key];
                    if (key === 'name') {
                        val = attrTaxonomy;
                    }
                    let valLen = val.length || val.toString().length;
                    let keyType = this.getShortTypeOf(key);
                    let valType = this.getShortTypeOf(val);
                    if (key === 'is_taxonomy') {
                        b.push(`${keyType}:${keyLen}:"${key}";${valType}:${valLen}`);
                    } else {
                        b.push(`${keyType}:${keyLen}:"${key}";${valType}:${valLen}:"${val}"`);
                    }
                }
            }
            b = `a:${b.length}:{${b.join(';')};}`;
            const attrTaxonomyLength = attrTaxonomy.length || attrTaxonomy.toString().length;
            attrCData.push(`s:${attrTaxonomyLength}:"${attrTaxonomy}";${b}`);
        });

        return `a:${attrCData.length}:{${attrCData.join('')}}`;
    }

    /**
     * Gets type of variable for CDATA.
     *
     * @param variable
     * @return {*|string}
     */
    getShortTypeOf(variable) {
        return {number: 'i'}[typeof variable] || (typeof variable).substring(0, 1);
    }

    /**
     * Returns generated WMR(XML).
     *
     * @param {boolean} options.pretty - whether to pretty print the output or not
     * @param {string} options.indent - standard indentation
     * @param {string} options.newline - new line character
     * @return string
     */
    stringify(options= {}) {
        return this.xml.end({
            pretty: false,
            indent: '    ',
            newline: '\n',
            ...options
        });
    }

    /**
     * Returns well formed WXR
     *
     * @param {boolean} options.pretty - whether to pretty print the output or not
     * @param {string} options.indent - standard indentation
     * @param {string} options.newline - new line character
     * @return {string}
     */
    generateWXR(options= {}) {
        let catsToAdd = [];
        let pCatsToAdd = [];
        let pAttrsToAdd = [];
        let menusToAdd = [];
        let tagsToAdd = [];
        if (Array.isArray(this.usersToAdd)) {
            for (const user of this.usersToAdd) {
                this.addUser(user);
            }
        }
        if (Array.isArray(this.termsToAdd)) {
            for (const term of this.termsToAdd) {
                if (term.type === 'category') {
                    catsToAdd.push(term);
                } else if (term.type === 'product_cat') {
                    pCatsToAdd.push(term);
                } else if (term.type === 'product_attribute') {
                    pAttrsToAdd.push(term);
                } else if (term.type === 'nav_menu') {
                    menusToAdd.push(term);
                } else if (term.type === 'tag') {
                    tagsToAdd.push(term);
                }
            }
        }
        if (Array.isArray(tagsToAdd)) {
            for (const tag of tagsToAdd) {
                this.addTag(tag);
            }
        }
        if (Array.isArray(catsToAdd)) {
            for (const cat of catsToAdd) {
                this.addCategory(cat);
            }
        }
        if (Array.isArray(pCatsToAdd)) {
            for (const pCat of pCatsToAdd) {
                this.addProductCategory(pCat);
            }
        }
        if (Array.isArray(pAttrsToAdd)) {
            for (const pAttr of pAttrsToAdd) {
                this.addProductAttribute(pAttr);
            }
        }
        if (Array.isArray(menusToAdd)) {
            for (const menu of menusToAdd) {
                this.addMenu(menu);
            }
        }
        if (Array.isArray(this.postsToAdd)) {
            for (const post of this.postsToAdd) {
                this.addPost(post);
            }
        }
        if (Array.isArray(this.productsToAdd)) {
            for (const product of this.productsToAdd) {
                this.addProduct(product);
            }
        }
        if (Array.isArray(this.menuItemsToAdd)) {
            for (const menuItem of this.menuItemsToAdd) {
                this.addMenuItem(menuItem);
            }
        }
        if (Array.isArray(this.attachmentsToAdd)) {
            for (const attachment of this.attachmentsToAdd) {
                this.addAttachment(attachment);
            }
        }

        return this.stringify(options);
    }
}
