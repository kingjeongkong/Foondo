-- CreateTable
CREATE TABLE "cities" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "country" TEXT,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foods" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "city_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "foods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "place_id" TEXT NOT NULL,
    "city_id" TEXT,
    "name" TEXT,
    "address" TEXT,
    "photo_url" TEXT,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "restaurant_id" UUID NOT NULL,
    "taste_score" REAL,
    "price_score" REAL,
    "atmosphere_score" REAL,
    "service_score" REAL,
    "quantity_score" REAL,
    "accessibility_score" REAL,
    "ai_summary" TEXT,

    CONSTRAINT "restaurant_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_foods" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "restaurant_id" UUID NOT NULL,
    "food_id" UUID NOT NULL,

    CONSTRAINT "restaurant_foods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cities_name_country_key" ON "cities"("name", "country");

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_place_id_key" ON "restaurants"("place_id");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_reports_restaurant_id_key" ON "restaurant_reports"("restaurant_id");

-- CreateIndex
CREATE INDEX "restaurant_foods_restaurant_id_idx" ON "restaurant_foods"("restaurant_id");

-- CreateIndex
CREATE INDEX "restaurant_foods_food_id_idx" ON "restaurant_foods"("food_id");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_foods_restaurant_id_food_id_key" ON "restaurant_foods"("restaurant_id", "food_id");

-- AddForeignKey
ALTER TABLE "foods" ADD CONSTRAINT "foods_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_reports" ADD CONSTRAINT "restaurant_reports_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_foods" ADD CONSTRAINT "restaurant_foods_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_foods" ADD CONSTRAINT "restaurant_foods_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "foods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

