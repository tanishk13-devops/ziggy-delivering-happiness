import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FoodService } from '../../services/food.service';
import { CartService } from '../../services/cart.service';
import { RestaurantService } from '../../services/restaurant.service';
import { AuthService } from '../../services/auth.service';
import { ReviewService } from '../../services/review.service';
import { Food } from '../../models/food.model';
import { CartItem } from '../../models/cart.model';
import { Review } from '../../models/review.model';
import { PremiumRestaurant } from '../restaurant-list/restaurant-list.component';

interface MenuFoodItem extends Food {
  image: string;
}

interface MockReview {
  author: string;
  rating: number;
  date: string;
  comment: string;
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {
  restaurantId = 1;
  restaurant: PremiumRestaurant | null = null;
  foods: MenuFoodItem[] = [];
  categories: string[] = [];
  selectedCategory = '';
  searchTerm = '';
  sortBy: 'recommended' | 'priceLowToHigh' | 'priceHighToLow' | 'nameAsc' = 'recommended';
  filteredFoods: MenuFoodItem[] = [];
  loading = true;
  errorMessage = '';
  readonly skeletonItems = Array.from({ length: 8 });
  addSuccessMessage = '';

  // Menu Tabs: Delivery vs Dining Booking vs Reviews
  menuTab: 'delivery' | 'dining' | 'reviews' = 'delivery';

  // Table Booking variables
  bookingDate = '';
  bookingTime = '19:30';
  bookingGuests = 2;
  bookingTicket: any = null;

  // Mock Reviews
  deliveryReviews: MockReview[] = [
    { author: 'Rahul Sharma', rating: 5, date: 'Yesterday', comment: 'Fastest delivery ever! Food was piping hot and package was sealed nicely.' },
    { author: 'Sneha Patel', rating: 4, date: '3 days ago', comment: 'Loved the Schezwan noodles. The portion was huge, could use a bit more spice.' },
    { author: 'Amit Gupta', rating: 4.5, date: '1 week ago', comment: 'Dal Makhani was incredibly creamy. Standard delivery was prompt (around 22 minutes).' }
  ];

  diningReviews: MockReview[] = [
    { author: 'Pooja Hegde', rating: 5, date: 'Last weekend', comment: 'Elegant ambiance, stellar light arrangement, and the live music was outstanding! Reservation was verified instantly.' },
    { author: 'Vikram Singh', rating: 4.8, date: '2 weeks ago', comment: 'Extremely polite staff. The chef recommended special recipes. Perfect spot for family dinners.' },
    { author: 'Nisha K.', rating: 4.2, date: '3 weeks ago', comment: 'Beautiful glass ceiling view. It gets quite crowded on Saturdays, so definitely book a table beforehand.' }
  ];

  databaseReviews: Review[] = [];
  newReviewRating = 5;
  newReviewComment = '';
  submittingReview = false;
  reviewError = '';

  readonly defaultFoodImage = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1200';
  readonly foodImageMap: Record<string, string> = {
    'paneer tikka': 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?q=80&w=600',
    'crispy corn': 'https://www.indianhealthyrecipes.com/wp-content/uploads/2023/09/crispy-corn.webp',
    'veg spring roll': 'https://www.vegrecipesofindia.com/wp-content/uploads/2015/10/veg-spring-rolls-recipe.jpg',
    'chicken 65': 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?q=80&w=600',
    'hara bhara kebab': 'https://www.indianhealthyrecipes.com/wp-content/uploads/2021/05/hara-bhara-kabab.jpg',
    'peri peri fries': 'https://images.unsplash.com/photo-1576107232684-1279f390859f?q=80&w=600',
    'chilli paneer': 'https://howtomakerecipes.com/wp-content/uploads/2023/01/chilli-paneer-starter-recipe1.jpg',
    'honey chilli potato': 'https://images.unsplash.com/photo-1604908554027-0c0cfa5a9b43',
    'tandoori wings': 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?q=80&w=600',
    'stuffed mushrooms': 'https://blackberrybabe.com/wp-content/uploads/2023/11/Stuffed-Portobello-Mushrooms.jpg',
    'butter chicken': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?q=80&w=600',
    'kadai paneer': 'https://images.unsplash.com/photo-1596797038530-2c107229654b?q=80&w=600',
    'dal makhani': 'https://www.indianhealthyrecipes.com/wp-content/uploads/2022/02/dal-makhani-recipe.jpg',
    'chicken biryani': 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?q=80&w=600',
    'veg biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=600',
    'mutton rogan josh': 'https://theyellowdaal.com/wp-content/uploads/2021/01/1611762173130.jpg',
    'prawn curry': 'https://www.whiskaffair.com/wp-content/uploads/2023/02/Shrimp-Masala-2-3.jpg',
    'thai green curry': 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?q=80&w=600',
    'veg alfredo pasta': 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?q=80&w=600',
    'paneer butter masala': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=600',
    'fish tikka masala': 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=600',
    'hyderabadi dum biryani': 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=600',
    'chole bhature combo': 'https://images.unsplash.com/photo-1626500155537-93690c24099e',
    'rajma chawal bowl': 'https://images.unsplash.com/photo-1617093727343-374698b1b08d',
    'schezwan noodles': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?q=80&w=600',
    'gulab jamun': 'https://pipingpotcurry.com/wp-content/uploads/2023/12/Gulab-Jamun-Recipe-Piping-Pot-Curry.jpg',
    'brownie sundae': 'https://www.bakerykart.com/upload/recipe/large/brownie-sundae-recipe.jpg',
    'rasmalai': 'https://aromaticessence.co/wp-content/uploads/2018/05/49E95995-028D-44D2-9252-2CDA545120D8.jpeg',
    'chocolate mousse': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=600',
    'kulfi falooda': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?q=80&w=600',
    'cheesecake slice': 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=600',
    'shahi tukda': 'https://www.indianhealthyrecipes.com/wp-content/uploads/2022/02/shahi-tukda-recipe.jpg',
    'tiramisu cup': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=80&w=600',
    'masala chaas': 'https://images.unsplash.com/photo-15555396273-367ea4eb4db5?q=80&w=600',
    'lemon iced tea': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=600',
    'cold coffee': 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=600',
    'mango shake': 'https://images.unsplash.com/photo-1553530979-7ee52a2670c4?q=80&w=600',
    'fresh lime soda': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=600',
    'filter coffee': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=600',
    'mint mojito': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=600',
    'hot chocolate': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=600'
  };

  constructor(
    private foodService: FoodService,
    private cartService: CartService,
    private restaurantService: RestaurantService,
    public authService: AuthService,
    private reviewService: ReviewService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Set default booking date to today
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    this.bookingDate = `${yyyy}-${mm}-${dd}`;

    this.route.paramMap.subscribe(params => {
      this.restaurantId = Number(params.get('restaurantId') || 1);
      this.loadRestaurantDetails();
      this.loadFoods();
      this.loadReviews();
    });
  }

  loadRestaurantDetails(): void {
    this.restaurantService.getRestaurant(this.restaurantId).subscribe({
      next: (r) => {
        const id = r.id || 1;
        const costForTwo = ((id * 150) % 600) + 250;
        const isVeg = id % 3 === 0;
        const isGold = id % 2 === 0;

        let cuisines = 'North Indian, Fast Food, Chinese';
        if (id % 4 === 0) cuisines = 'North Indian, Biryani, Mughlai';
        else if (id % 4 === 1) cuisines = 'Burgers, Fast Food, Beverages';
        else if (id % 4 === 2) cuisines = 'Pizza, Italian, Fast Food';
        else if (id % 4 === 3) cuisines = 'Chinese, Asian, Thai';

        let knownFor = 'Stellar ambiance, live sports screening, and artisanal mocktails.';
        if (id % 3 === 1) knownFor = 'Decadent desserts, organic ingredients, and prompt service.';
        else if (id % 3 === 2) knownFor = 'Gourmet plating, authentic flavors, and family-friendly environment.';

        let popularDishes = 'Classic Cheese Pizza, Truffle Fries, Blueberry Cheesecake';
        if (id % 3 === 1) popularDishes = 'Paneer Tikka, Butter Chicken, Garlic Naan';
        else if (id % 3 === 2) popularDishes = 'Schezwan Noodles, Spring Rolls, Dim Sums';

        this.restaurant = {
          ...r,
          costForTwo,
          cuisines,
          isVeg,
          isGold,
          knownFor,
          popularDishes
        } as PremiumRestaurant;
      }
    });
  }

  loadFoods(): void {
    this.loading = true;
    this.errorMessage = '';

    this.foodService.getRestaurantMenu(this.restaurantId).subscribe({
      next: (foods) => {
        this.foods = this.mapFoodsWithUniqueImages(foods);
        this.extractCategories();
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.foods = [];
        this.filteredFoods = [];
        this.categories = [];
        this.errorMessage = 'Unable to load menu right now. Please try again.';
        this.loading = false;
      }
    });
  }

  extractCategories(): void {
    this.categories = [...new Set(this.foods.map(f => f.category?.name || f.categoryName).filter(Boolean) as string[])];
  }

  setMenuTab(tab: 'delivery' | 'dining' | 'reviews'): void {
    this.menuTab = tab;
  }

  // Table Reservation logic
  bookTable(): void {
    if (!this.authService.isLoggedIn()) {
      alert('Please login to reserve a table.');
      return;
    }
    this.bookingTicket = {
      restaurantName: this.restaurant?.name || 'Restaurant Partner',
      restaurantLocation: this.restaurant?.location || 'Nearby',
      guestName: this.authService.getCurrentUser()?.name || 'Guest',
      date: this.bookingDate,
      time: this.bookingTime,
      guestsCount: this.bookingGuests,
      ticketId: 'ZG-' + Math.floor(100000 + Math.random() * 900000)
    };
  }

  cancelBooking(): void {
    this.bookingTicket = null;
  }

  filterByCategory(): void {
    this.applyFilters();
  }

  onCategoryChange(): void {
    this.filterByCategory();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.selectedCategory = '';
    this.searchTerm = '';
    this.sortBy = 'recommended';
    this.applyFilters();
  }

  private applyFilters(): void {
    let list = [...this.foods];

    if (this.selectedCategory) {
      list = list.filter(f => (f.category?.name || f.categoryName) === this.selectedCategory);
    }

    const search = this.searchTerm.trim().toLowerCase();
    if (search) {
      list = list.filter(f =>
        f.name.toLowerCase().includes(search) ||
        (f.description || '').toLowerCase().includes(search));
    }

    switch (this.sortBy) {
      case 'priceLowToHigh':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'priceHighToLow':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'nameAsc':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    this.filteredFoods = list;
  }

  addToCart(food: Food): void {
    if (food.id) {
      const cartItem: CartItem = {
        foodItemId: food.id,
        price: food.price,
        quantity: 1
      };
      this.cartService.addToCart(cartItem).subscribe({
        next: () => {
          this.addSuccessMessage = `${food.name} added to cart`;
          setTimeout(() => (this.addSuccessMessage = ''), 1200);
        },
        error: (err) => {
          if (err?.status === 401) {
            this.router.navigate(['/login']);
            return;
          }
        }
      });
    }
  }

  onImageError(item: MenuFoodItem, index: number): void {
    item.image = this.defaultFoodImage;
  }

  loadReviews(): void {
    this.reviewService.getRestaurantReviews(this.restaurantId).subscribe({
      next: (revs) => {
        this.databaseReviews = revs;
      },
      error: () => {
        this.databaseReviews = [];
      }
    });
  }

  submitReview(): void {
    if (!this.authService.isLoggedIn()) {
      alert('Please login to write a review.');
      return;
    }
    if (!this.newReviewComment.trim() || this.newReviewComment.trim().length < 5) {
      this.reviewError = 'Review comment must be at least 5 characters long.';
      return;
    }
    if (this.newReviewRating < 1 || this.newReviewRating > 5) {
      this.reviewError = 'Rating must be between 1 and 5 stars.';
      return;
    }

    this.submittingReview = true;
    this.reviewError = '';

    const reviewData: Review = {
      restaurantId: this.restaurantId,
      rating: this.newReviewRating,
      comment: this.newReviewComment
    };

    this.reviewService.addReview(reviewData).subscribe({
      next: () => {
        this.submittingReview = false;
        this.newReviewComment = '';
        this.newReviewRating = 5;
        this.loadReviews();
        alert('Review submitted successfully!');
      },
      error: () => {
        this.submittingReview = false;
        this.reviewError = 'Failed to submit review. Try again.';
      }
    });
  }

  trackByFood(index: number, item: MenuFoodItem): number {
    return item.id ?? index;
  }

  private mapFoodsWithUniqueImages(foods: Food[]): MenuFoodItem[] {
    return foods.map((item) => {
      const isPlaceholder = !item.imageUrl || item.imageUrl.trim() === '' || item.imageUrl.includes('dummyimage.com');
      const image = !isPlaceholder 
        ? item.imageUrl! 
        : (this.foodImageMap[this.extractBaseDishName(item.name)] || this.defaultFoodImage);

      return {
        ...item,
        image
      };
    });
  }

  private extractBaseDishName(name: string): string {
    return (name || '')
      .split(' - ')[0]
      .trim()
      .toLowerCase();
  }
}
