-- Backfill missing company coordinates from headquarters city.
-- This migration is defensive: it only runs updates for coordinate columns that exist.

do $$
declare
  has_lat boolean;
  has_lng boolean;
  has_latitude boolean;
  has_longitude boolean;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'AI_Atlas_Companies'
      and column_name = 'lat'
  ) into has_lat;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'AI_Atlas_Companies'
      and column_name = 'lng'
  ) into has_lng;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'AI_Atlas_Companies'
      and column_name = 'latitude'
  ) into has_latitude;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'AI_Atlas_Companies'
      and column_name = 'longitude'
  ) into has_longitude;

  if has_lat and has_lng then
    execute $sql$
      with city_coordinates (city, lat, lng) as (
        values
          ('Salt Lake City', 40.7608, -111.8910),
          ('Santa Clara', 37.3541, -121.9552),
          ('New York', 40.7128, -74.0060),
          ('Scottsdale', 33.4942, -111.9261),
          ('Boston', 42.3601, -71.0589),
          ('San Francisco', 37.7749, -122.4194),
          ('Seattle', 47.6062, -122.3321),
          ('Austin', 30.2672, -97.7431),
          ('Los Angeles', 34.0522, -118.2437),
          ('Chicago', 41.8781, -87.6298),
          ('Mountain View', 37.3861, -122.0839),
          ('Palo Alto', 37.4419, -122.1430),
          ('Menlo Park', 37.4530, -122.1817),
          ('London', 51.5074, -0.1278),
          ('Oxford', 51.7520, -1.2577),
          ('Cambridge', 52.2053, 0.1218),
          ('Edinburgh', 55.9533, -3.1883),
          ('Manchester', 53.4808, -2.2426),
          ('Tel Aviv', 32.0853, 34.7818),
          ('Jerusalem', 31.7683, 35.2137),
          ('Haifa', 32.7940, 34.9896),
          ('Hong Kong', 22.3193, 114.1694),
          ('Beijing', 39.9042, 116.4074),
          ('Shanghai', 31.2304, 121.4737),
          ('Shenzhen', 22.5431, 114.0579),
          ('Hangzhou', 30.2741, 120.1551),
          ('Berlin', 52.5200, 13.4050),
          ('Munich', 48.1351, 11.5820),
          ('Frankfurt', 50.1109, 8.6821),
          ('Paris', 48.8566, 2.3522),
          ('Toronto', 43.6532, -79.3832),
          ('Montreal', 45.5017, -73.5673),
          ('Vancouver', 49.2827, -123.1207),
          ('Tokyo', 35.6762, 139.6503),
          ('Osaka', 34.6937, 135.5023),
          ('Seoul', 37.5665, 126.9780),
          ('Bangalore', 12.9716, 77.5946),
          ('Mumbai', 19.0760, 72.8777),
          ('Delhi', 28.7041, 77.1025),
          ('Sydney', -33.8688, 151.2093),
          ('Melbourne', -37.8136, 144.9631),
          ('Singapore', 1.3521, 103.8198),
          ('Amsterdam', 52.3676, 4.9041),
          ('Stockholm', 59.3293, 18.0686),
          ('Zurich', 47.3769, 8.5417),
          ('Geneva', 46.2044, 6.1432)
      )
      update public."AI_Atlas_Companies" c
      set
        lat = cc.lat,
        lng = cc.lng
      from city_coordinates cc
      where lower(trim(c.city)) = lower(trim(cc.city))
        and (c.lat is null or c.lng is null);
    $sql$;
  end if;

  if has_latitude and has_longitude then
    execute $sql$
      with city_coordinates (city, latitude, longitude) as (
        values
          ('Salt Lake City', 40.7608, -111.8910),
          ('Santa Clara', 37.3541, -121.9552),
          ('New York', 40.7128, -74.0060),
          ('Scottsdale', 33.4942, -111.9261),
          ('Boston', 42.3601, -71.0589),
          ('San Francisco', 37.7749, -122.4194),
          ('Seattle', 47.6062, -122.3321),
          ('Austin', 30.2672, -97.7431),
          ('Los Angeles', 34.0522, -118.2437),
          ('Chicago', 41.8781, -87.6298),
          ('Mountain View', 37.3861, -122.0839),
          ('Palo Alto', 37.4419, -122.1430),
          ('Menlo Park', 37.4530, -122.1817),
          ('London', 51.5074, -0.1278),
          ('Oxford', 51.7520, -1.2577),
          ('Cambridge', 52.2053, 0.1218),
          ('Edinburgh', 55.9533, -3.1883),
          ('Manchester', 53.4808, -2.2426),
          ('Tel Aviv', 32.0853, 34.7818),
          ('Jerusalem', 31.7683, 35.2137),
          ('Haifa', 32.7940, 34.9896),
          ('Hong Kong', 22.3193, 114.1694),
          ('Beijing', 39.9042, 116.4074),
          ('Shanghai', 31.2304, 121.4737),
          ('Shenzhen', 22.5431, 114.0579),
          ('Hangzhou', 30.2741, 120.1551),
          ('Berlin', 52.5200, 13.4050),
          ('Munich', 48.1351, 11.5820),
          ('Frankfurt', 50.1109, 8.6821),
          ('Paris', 48.8566, 2.3522),
          ('Toronto', 43.6532, -79.3832),
          ('Montreal', 45.5017, -73.5673),
          ('Vancouver', 49.2827, -123.1207),
          ('Tokyo', 35.6762, 139.6503),
          ('Osaka', 34.6937, 135.5023),
          ('Seoul', 37.5665, 126.9780),
          ('Bangalore', 12.9716, 77.5946),
          ('Mumbai', 19.0760, 72.8777),
          ('Delhi', 28.7041, 77.1025),
          ('Sydney', -33.8688, 151.2093),
          ('Melbourne', -37.8136, 144.9631),
          ('Singapore', 1.3521, 103.8198),
          ('Amsterdam', 52.3676, 4.9041),
          ('Stockholm', 59.3293, 18.0686),
          ('Zurich', 47.3769, 8.5417),
          ('Geneva', 46.2044, 6.1432)
      )
      update public."AI_Atlas_Companies" c
      set
        latitude = cc.latitude,
        longitude = cc.longitude
      from city_coordinates cc
      where lower(trim(c.city)) = lower(trim(cc.city))
        and (c.latitude is null or c.longitude is null);
    $sql$;
  end if;
end $$;
