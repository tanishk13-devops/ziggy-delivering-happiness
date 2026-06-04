using Microsoft.EntityFrameworkCore;
using FoodDeliveryAPI.Data;
using FoodDeliveryAPI.Models;
using FoodDeliveryAPI.Repositories.Implementations;
using FoodDeliveryAPI.Repositories.Interfaces;
using FoodDeliveryAPI.Services.Implementations;
using FoodDeliveryAPI.Services.Interfaces;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add DbContext - default to PostgreSQL, optional in-memory fallback for local dev
var rawDatabaseUrl = builder.Configuration["DATABASE_URL"];
var defaultConnection = builder.Configuration.GetConnectionString("DefaultConnection");
var useInMemoryDatabase = builder.Configuration.GetValue<bool>("UseInMemoryDatabase");

var postgresConnectionString =
    !string.IsNullOrWhiteSpace(rawDatabaseUrl)
        ? ConvertDatabaseUrlToConnectionString(rawDatabaseUrl)
        : defaultConnection;

if (!useInMemoryDatabase && string.IsNullOrWhiteSpace(postgresConnectionString))
{
    throw new InvalidOperationException(
        "PostgreSQL connection string is missing. Configure DATABASE_URL or ConnectionStrings:DefaultConnection.");
}

builder.Services.AddDbContext<FoodDeliveryDbContext>(options =>
{
    if (useInMemoryDatabase)
    {
        options.UseInMemoryDatabase("FoodDeliveryDb");
    }
    else
    {
        options.UseNpgsql(
            postgresConnectionString!,
            npgsqlOptions =>
            {
                npgsqlOptions.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null);
                npgsqlOptions.CommandTimeout(120);
            });
    }
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtKey = builder.Configuration["Jwt:Key"] ?? "ThisIsADevelopmentOnlySuperSecretJwtKey123!";
        var issuer = builder.Configuration["Jwt:Issuer"] ?? "FoodDeliveryAPI";
        var audience = builder.Configuration["Jwt:Audience"] ?? "FoodDeliveryAPI.Client";

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = issuer,
            ValidAudience = audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddHttpClient();

// Repository registrations
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IRestaurantRepository, RestaurantRepository>();
builder.Services.AddScoped<IFoodRepository, FoodRepository>();
builder.Services.AddScoped<ICartRepository, CartRepository>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IAddressRepository, AddressRepository>();
builder.Services.AddScoped<IPaymentRepository, PaymentRepository>();
builder.Services.AddScoped<IReviewRepository, ReviewRepository>();

// Service registrations
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IRestaurantService, RestaurantService>();
builder.Services.AddScoped<IFoodService, FoodService>();
builder.Services.AddScoped<IFoodImageService, FoodImageService>();
builder.Services.AddScoped<ICartService, CartService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IAddressService, AddressService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IReviewService, ReviewService>();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        var allowedOrigins = builder.Configuration["CORS__ALLOWED_ORIGINS"];

        if (!string.IsNullOrWhiteSpace(allowedOrigins))
        {
            var origins = allowedOrigins
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

            policy.SetIsOriginAllowed(origin =>
                  {
                      if (string.IsNullOrWhiteSpace(origin))
                      {
                          return false;
                      }

                      // Explicit allow-list from env var.
                      if (origins.Contains(origin, StringComparer.OrdinalIgnoreCase))
                      {
                          return true;
                      }

                      // Allow Vercel hosted frontend domains.
                      if (Uri.TryCreate(origin, UriKind.Absolute, out var uri)
                          && uri.Scheme == Uri.UriSchemeHttps
                          && uri.Host.EndsWith(".vercel.app", StringComparison.OrdinalIgnoreCase))
                      {
                          return true;
                      }

                      // Allow local frontend development origins.
                      if (Uri.TryCreate(origin, UriKind.Absolute, out var localUri)
                          && (localUri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
                              || localUri.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase))
                          && (localUri.Port == 3000 || localUri.Port == 4200 || localUri.Port == 5173))
                      {
                          return true;
                      }

                      return false;
                  })
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        }
        else
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        }
    });
});

var app = builder.Build();
var seedDataOnStartup = app.Configuration.GetValue<bool?>("SeedDataOnStartup") ?? app.Environment.IsDevelopment();
var seedFullCatalogOnStartup = app.Configuration.GetValue<bool?>("SeedFullCatalogOnStartup") ?? app.Environment.IsDevelopment();

var renderPort = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrWhiteSpace(renderPort))
{
    app.Urls.Add($"http://0.0.0.0:{renderPort}");
}

try
{
    // Configure middleware
    if (app.Environment.IsDevelopment() || app.Configuration.GetValue<bool>("EnableSwagger"))
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.UseForwardedHeaders(new ForwardedHeadersOptions
    {
        ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
    });

    if (app.Environment.IsDevelopment())
    {
        app.UseHttpsRedirection();
    }

    app.UseCors("AllowAll");
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapGet("/", () => Results.Ok(new
    {
        service = "ziggy-api",
        status = "ok",
        docs = "/health",
        api = "/api/restaurants"
    }));
    app.MapGet("/health", () => Results.Ok(new { status = "ok", service = "ziggy-api" }));
    app.MapControllers();

    if (seedDataOnStartup)
    {
        app.Lifetime.ApplicationStarted.Register(() =>
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    await TryInitializeAndSeedDataAsync(app.Services, app.Logger, seedFullCatalogOnStartup);
                }
                catch (Exception ex)
                {
                    app.Logger.LogError(ex, "Background startup data initialization failed.");
                }
            });
        });

        app.Logger.LogInformation("SeedDataOnStartup is enabled. Data seeding will run in the background after startup.");
    }
    else
    {
        app.Logger.LogInformation("SeedDataOnStartup is disabled. Skipping startup data seeding.");
    }

    Console.WriteLine("FoodDeliveryAPI started successfully.");

    await app.RunAsync();
}
catch (Exception ex)
{
    Console.WriteLine($"FATAL ERROR: {ex}");
    throw;
}

static string ConvertDatabaseUrlToConnectionString(string databaseUrl)
{
    // Render-style value: postgres://user:password@host:5432/database
    if (!Uri.TryCreate(databaseUrl, UriKind.Absolute, out var uri))
    {
        return databaseUrl;
    }

    var userInfo = uri.UserInfo.Split(':', 2);
    var username = Uri.UnescapeDataString(userInfo[0]);
    var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty;
    var database = uri.AbsolutePath.Trim('/');

    var builder = new NpgsqlConnectionStringBuilder
    {
        Host = uri.Host,
        Port = uri.Port > 0 ? uri.Port : 5432,
        Username = username,
        Password = password,
        Database = database,
        SslMode = SslMode.Require
    };

    return builder.ConnectionString;
}

static async Task TryInitializeAndSeedDataAsync(IServiceProvider rootServices, ILogger logger, bool seedFullCatalog)
{
    const int maxAttempts = 3;

    for (var attempt = 1; attempt <= maxAttempts; attempt++)
    {
        try
        {
            using var scope = rootServices.CreateScope();
            var services = scope.ServiceProvider;
            var context = services.GetRequiredService<FoodDeliveryDbContext>();

            if (context.Database.IsRelational())
            {
                context.Database.SetCommandTimeout(120);
            }
            context.Database.EnsureCreated();

            if (!context.Users.Any())
            {
                context.Users.AddRange(
                    new User
                    {
                        Name = "Platform Admin",
                        Email = "admin@ziggy.com",
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                        Role = "Admin"
                    },
                    new User
                    {
                        Name = "Rahul Customer",
                        Email = "customer@ziggy.com",
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("Customer@123"),
                        Role = "Customer"
                    },
                    new User
                    {
                        Name = "Aman Rider",
                        Email = "delivery@ziggy.com",
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("Delivery@123"),
                        Role = "DeliveryAgent"
                    }
                );
                context.SaveChanges();
            }

            if (!context.FoodCategories.Any())
            {
                context.FoodCategories.AddRange(
                    new FoodCategory { Name = "Main Course" },
                    new FoodCategory { Name = "Desserts" },
                    new FoodCategory { Name = "Starters" },
                    new FoodCategory { Name = "Beverages" }
                );
                context.SaveChanges();
            }

            if (!context.Restaurants.Any())
            {
                SeedRestaurants(context);
            }

            if (context.Restaurants.Count() < 25)
            {
                SeedRestaurants(context);
            }

            if (seedFullCatalog)
            {
                var foodImageService = services.GetRequiredService<IFoodImageService>();

                if (context.Foods.Count() < 250)
                {
                    await SeedFoodsAsync(context, 250, foodImageService);
                }

                // Ensure all existing dishes have unique, dish-specific image URLs.
                var foodsToRefresh = context.Foods
                    .Include(f => f.Restaurant)
                    .ToList();

                var refreshed = false;
                foreach (var food in foodsToRefresh)
                {
                    var baseDishName = food.Name.Contains(" - ", StringComparison.Ordinal)
                        ? food.Name.Split(" - ", StringSplitOptions.RemoveEmptyEntries)[0]
                        : food.Name;

                    var expected = await ResolveDishImageUrlAsync(baseDishName, foodImageService);
                    if (food.ImageUrl != expected)
                    {
                        food.ImageUrl = expected;
                        refreshed = true;
                    }
                }

                if (refreshed)
                {
                    context.SaveChanges();
                }
            }

            logger.LogInformation("Startup data initialization completed successfully.");
            return;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Startup data initialization attempt {Attempt}/{MaxAttempts} failed.", attempt, maxAttempts);

            if (attempt == maxAttempts)
            {
                logger.LogError("Skipping startup data initialization after {MaxAttempts} failed attempts.", maxAttempts);
                return;
            }

            await Task.Delay(TimeSpan.FromSeconds(5 * attempt));
        }
    }
}

static void SeedRestaurants(FoodDeliveryDbContext context)
{
    var catalog = new List<(string Name, string Description, string Location, decimal Rating, string ImageUrl)>
    {
        ("Spice Route", "North Indian favorites, biryanis, and tandoor specials.", "Noida Sector 18", 4.4m, "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=1200"),
        ("Coastal Bowl", "South Indian and coastal comfort food.", "Gurgaon CyberHub", 4.3m, "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1200"),
        ("Tandoor Tales", "Signature kebabs, curries, and handcrafted breads.", "Delhi Connaught Place", 4.5m, "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?q=80&w=1200"),
        ("Urban Biryani House", "Layered biryanis and mughlai delicacies.", "Noida Sector 62", 4.2m, "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?q=80&w=1200"),
        ("Wok & Flame", "Asian stir-fries, noodles, and rice bowls.", "Gurgaon Sector 29", 4.1m, "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=1200"),
        ("Curry Junction", "Homestyle curries and thali meals.", "Ghaziabad Indirapuram", 4.0m, "https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=1200"),
        ("Nawabi Kitchen", "Rich Awadhi gravies and kebab platters.", "Lucknow Hazratganj", 4.6m, "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=1200"),
        ("Punjab Express", "Butter-loaded Punjabi classics and combos.", "Chandigarh Sector 17", 4.2m, "https://images.unsplash.com/photo-1606491956689-2ea866880c84?q=80&w=1200"),
        ("Dosa District", "Crispy dosas, idli varieties, and filter coffee.", "Bengaluru Indiranagar", 4.3m, "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?q=80&w=1200"),
        ("Roll Republic", "Kathi rolls, wraps, and quick bites.", "Kolkata Park Street", 4.1m, "https://images.unsplash.com/photo-1626700051175-6518c4793f4f?q=80&w=1200"),
        ("Bombay Street Co.", "Mumbai street food and chaats.", "Mumbai Bandra", 4.3m, "https://images.unsplash.com/photo-1626132647523-66f5bf380027?q=80&w=1200"),
        ("The Kebab Club", "Grilled meats and smoky starters.", "Delhi Rajouri Garden", 4.4m, "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?q=80&w=1200"),
        ("Bowl Theory", "Healthy bowls and protein-rich plates.", "Pune Hinjewadi", 4.0m, "https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=1200"),
        ("Royal Rasoi", "Festive Indian meals and family packs.", "Jaipur C-Scheme", 4.5m, "https://images.unsplash.com/photo-1585238342024-78d387f4a707?q=80&w=1200"),
        ("Pasta & Peppers", "Italian pasta, pizza, and sides.", "Hyderabad Jubilee Hills", 4.1m, "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=1200"),
        ("Sushi Saga", "Fresh sushi rolls and Japanese bowls.", "Bengaluru Koramangala", 4.4m, "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=1200"),
        ("Mexi Fiesta", "Tacos, burritos, and loaded nachos.", "Pune Kalyani Nagar", 4.0m, "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?q=80&w=1200"),
        ("Burger Borough", "Smash burgers, fries, and shakes.", "Delhi Saket", 4.2m, "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1200"),
        ("Pizza Planet", "Wood-fired pizzas and garlic breads.", "Noida Sector 75", 4.1m, "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1200"),
        ("Green Leaf Meals", "Vegan and salad-friendly wholesome meals.", "Gurgaon Golf Course Road", 4.0m, "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1200"),
        ("Chai & Snacks Lab", "Tea-time snacks and baked munchies.", "Ahmedabad CG Road", 4.1m, "https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=1200"),
        ("Ramen Republic", "Ramen bowls and Japanese comfort food.", "Chennai Nungambakkam", 4.3m, "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=1200"),
        ("Grill Garden", "BBQ platters and grilled signature dishes.", "Indore Vijay Nagar", 4.2m, "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1200"),
        ("Dessert Den", "Cakes, brownies, and chilled desserts.", "Kolkata Salt Lake", 4.4m, "https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=1200"),
        ("Midnight Munchies", "Late-night combos and comfort food.", "Mumbai Andheri", 4.0m, "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=1200")
    };

    var existingNames = context.Restaurants.Select(r => r.Name).ToHashSet(StringComparer.OrdinalIgnoreCase);
    var missingRestaurants = catalog
        .Where(r => !existingNames.Contains(r.Name))
        .Select(r => new Restaurant
        {
            Name = r.Name,
            Description = r.Description,
            Location = r.Location,
            Rating = r.Rating,
            ImageUrl = r.ImageUrl,
            CreatedAt = DateTime.UtcNow
        })
        .ToList();

    if (missingRestaurants.Any())
    {
        context.Restaurants.AddRange(missingRestaurants);
        context.SaveChanges();
    }
}

static async Task SeedFoodsAsync(FoodDeliveryDbContext context, int targetFoodCount, IFoodImageService foodImageService)
{
    var restaurants = context.Restaurants.OrderBy(r => r.Id).ToList();
    if (!restaurants.Any()) return;

    var categoryIds = context.FoodCategories.ToDictionary(c => c.Name, c => c.Id);
    var startersId = categoryIds["Starters"];
    var mainCourseId = categoryIds["Main Course"];
    var dessertsId = categoryIds["Desserts"];
    var beveragesId = categoryIds["Beverages"];

    var starters = new[]
    {
        "Paneer Tikka", "Crispy Corn", "Veg Spring Roll", "Chicken 65", "Hara Bhara Kebab",
        "Peri Peri Fries", "Chilli Paneer", "Honey Chilli Potato", "Tandoori Wings", "Stuffed Mushrooms"
    };

    var mains = new[]
    {
        "Butter Chicken", "Kadai Paneer", "Dal Makhani", "Chicken Biryani", "Veg Biryani",
        "Mutton Rogan Josh", "Prawn Curry", "Thai Green Curry", "Veg Alfredo Pasta", "Paneer Butter Masala",
        "Fish Tikka Masala", "Hyderabadi Dum Biryani", "Chole Bhature Combo", "Rajma Chawal Bowl", "Schezwan Noodles"
    };

    var desserts = new[]
    {
        "Gulab Jamun", "Brownie Sundae", "Rasmalai", "Chocolate Mousse", "Kulfi Falooda",
        "Cheesecake Slice", "Shahi Tukda", "Tiramisu Cup"
    };

    var beverages = new[]
    {
        "Masala Chaas", "Lemon Iced Tea", "Cold Coffee", "Mango Shake", "Fresh Lime Soda",
        "Filter Coffee", "Mint Mojito", "Hot Chocolate"
    };

    var existingKeys = context.Foods.Select(f => $"{f.RestaurantId}:{f.Name}").ToHashSet(StringComparer.OrdinalIgnoreCase);
    var newFoods = new List<Food>();
    var currentCount = context.Foods.Count();
    var cycle = 0;

    while (currentCount + newFoods.Count < targetFoodCount)
    {
        foreach (var restaurant in restaurants)
        {
            for (var slot = 0; slot < 10 && currentCount + newFoods.Count < targetFoodCount; slot++)
            {
                var (categoryId, baseName, imageUrl, basePrice) = slot switch
                {
                    0 or 1 or 2 =>
                        (startersId,
                        starters[(restaurant.Id + slot + cycle) % starters.Length],
                        string.Empty,
                        149m),
                    3 or 4 or 5 or 6 =>
                        (mainCourseId,
                        mains[(restaurant.Id + slot + cycle) % mains.Length],
                        string.Empty,
                        239m),
                    7 or 8 =>
                        (dessertsId,
                        desserts[(restaurant.Id + slot + cycle) % desserts.Length],
                        string.Empty,
                        99m),
                    _ =>
                        (beveragesId,
                        beverages[(restaurant.Id + slot + cycle) % beverages.Length],
                        string.Empty,
                        79m)
                };

                var name = $"{baseName} - {restaurant.Name}";
                var key = $"{restaurant.Id}:{name}";
                if (existingKeys.Contains(key))
                {
                    continue;
                }

                var price = basePrice + ((restaurant.Id + slot + cycle) % 12) * 10;
                var dishImageUrl = await ResolveDishImageUrlAsync(baseName, foodImageService);
                newFoods.Add(new Food
                {
                    Name = name,
                    Description = $"{baseName} crafted fresh by {restaurant.Name}.",
                    Price = price,
                    CategoryId = categoryId,
                    RestaurantId = restaurant.Id,
                    ImageUrl = dishImageUrl,
                    IsAvailable = true,
                    CreatedAt = DateTime.UtcNow
                });

                existingKeys.Add(key);
            }
        }

        cycle++;
        if (cycle > 20) break;
    }

    if (newFoods.Any())
    {
        context.Foods.AddRange(newFoods);
        context.SaveChanges();
    }
}

static async Task<string> ResolveDishImageUrlAsync(string baseDishName, IFoodImageService foodImageService)
{
    if (TryGetUploadedDishImageUrl(baseDishName, out var uploadedUrl))
    {
        return uploadedUrl;
    }

    return await foodImageService.GetFoodImageUrlAsync(baseDishName);
}

static bool TryGetUploadedDishImageUrl(string dishName, out string imageUrl)
{
    var uploadedDishUrls = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        ["Chole Bhature Combo"] = "https://images.unsplash.com/photo-1626500155537-93690c24099e",
        ["Honey Chilli Potato"] = "https://images.unsplash.com/photo-1604908554027-0c0cfa5a9b43",
        ["Rajma Chawal Bowl"] = "https://images.unsplash.com/photo-1617093727343-374698b1b08d",
        ["Shahi Tukda"] = "https://www.indianhealthyrecipes.com/wp-content/uploads/2022/02/shahi-tukda-recipe.jpg",
        ["Stuffed Mushrooms"] = "https://blackberrybabe.com/wp-content/uploads/2023/11/Stuffed-Portobello-Mushrooms.jpg",
        ["Hara Bhara Kebab"] = "https://www.indianhealthyrecipes.com/wp-content/uploads/2021/05/hara-bhara-kabab.jpg",
        ["Prawn Curry"] = "https://www.whiskaffair.com/wp-content/uploads/2023/02/Shrimp-Masala-2-3.jpg",
        ["Rasmalai"] = "https://aromaticessence.co/wp-content/uploads/2018/05/49E95995-028D-44D2-9252-2CDA545120D8.jpeg",
        ["Chilli Paneer"] = "https://howtomakerecipes.com/wp-content/uploads/2023/01/chilli-paneer-starter-recipe1.jpg",
        ["Dal Makhani"] = "https://www.indianhealthyrecipes.com/wp-content/uploads/2022/02/dal-makhani-recipe.jpg",
        ["Mutton Rogan Josh"] = "https://theyellowdaal.com/wp-content/uploads/2021/01/1611762173130.jpg",
        ["Brownie Sundae"] = "https://www.bakerykart.com/upload/recipe/large/brownie-sundae-recipe.jpg",
        ["Crispy Corn"] = "https://www.indianhealthyrecipes.com/wp-content/uploads/2023/09/crispy-corn.webp",
        ["Gulab Jamun"] = "https://pipingpotcurry.com/wp-content/uploads/2023/12/Gulab-Jamun-Recipe-Piping-Pot-Curry.jpg",
        ["Veg Spring Roll"] = "https://www.vegrecipesofindia.com/wp-content/uploads/2015/10/veg-spring-rolls-recipe.jpg"
    };

    return uploadedDishUrls.TryGetValue(dishName.Trim(), out imageUrl!);
}
