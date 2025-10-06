import Client1 from "../Assets/Images/client-1.png";
import Client2 from "../Assets/Images/client-2.png";
import Client3 from "../Assets/Images/client-3.png";
import Client4 from "../Assets/Images/client-4.png";
import Client5 from "../Assets/Images/client-5.png";
import Client6 from "../Assets/Images/client-6.png";
import Client7 from "../Assets/Images/client-7.png";
import Client8 from "../Assets/Images/client-8.png";
import Product1 from "../Assets/Images/product.jpg";
import Product2 from "../Assets/Images/product2.jpg";
import axios from "axios";

export const Clients = [
  Client1,
  Client2,
  Client3,
  Client4,
  Client5,
  Client6,
  Client7,
  Client8,
];

export const fetchProductsByItemTypes = async (selectedItemTypes) => {
  if (selectedItemTypes.length === 0) {
    return [];
  }

  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}api/itemtypes/filter`,
      {
        params: { item_types: selectedItemTypes.join(",") },
      }
    );
    // console.log("API Response for Filtered Products:", response.data);
    return Array.isArray(response.data.data) ? response.data.data : [];
  } catch (error) {
    // console.error("Error fetching filtered products:", error);
    return [];
  }
};

export const fetchProducts = async () => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}api/products`
    );

    // console.log("Full API Response:", response); // ✅ Log full response
    // console.log("Response Data:", response.data); // ✅ Log only data

    if (response.data && Array.isArray(response.data.products)) {
      // console.log("✅ Products Fetched:", response.data.products); // ✅ Log products array
      return response.data.products;
    } else {
      // console.error("❌ Invalid API response format:", response.data);
      return [];
    }
  } catch (error) {
    //  console.error(
    //   "❌ Error fetching products:",
    //   error.response ? error.response.data : error.message
    // );
    return [];
  }
};

export const cartItems = [
  {
    id: 1,
    name: "Urban Chic",
    quantity: 2,
    price: 3.84,
    image: Product1,
  },
  {
    id: 2,
    name: "Classic Jacket",
    quantity: 1,
    price: 7.84,
    image: Product1,
  },
  {
    id: 3,
    name: "Couture Edge",
    quantity: 1,
    price: 6.74,
    image: Product1,
  },
];

export const carouselData = [
  {
    id: 1,
    title: "Smart Watches Facilitate Your Every Activity",
    subtitle: "NEW EXCLUSIVE",
    description:
      "Each and every man needs a reliable watch. The Presidential Rolex watch is my favorite timepiece. I have a lot of watches, but I generally wear this one on my wrist.",
    buttonText: "Shop Now!",
    buttonLink: "/shop",
    imageUrl: Product2,
  },
  {
    id: 2,
    title: "Experience Next-Gen Smart Watches",
    subtitle: "LATEST COLLECTION",
    description:
      "Discover a new era of smartwatches with premium features, sleek design, and advanced technology.",
    buttonText: "Shop Now",
    buttonLink: "/shop",
    imageUrl: Product2,
  },
  {
    id: 3,
    title: "Style Meets Technology",
    subtitle: "TRENDING NOW",
    description:
      "Elevate your everyday look with smartwatches that combine fashion, fitness, and functionality in one sleek package.",
    buttonText: "Explore More",
    buttonLink: "/shop",
    imageUrl: Product2,
  },
];

export const faqData = [
  {
    question: "How do I protect my personal information when shopping online?",
    answer:
      'Use secure websites (look for "https" in the URL), avoid public Wi-Fi for sensitive transactions, regularly update passwords, and be cautious about sharing unnecessary personal information. Additionally, consider using a virtual private network (VPN) for added security, and monitor your financial statements regularly for any unauthorized transactions. Staying vigilant and adopting secure online practices is key to protecting your personal information.',
  },
  {
    question: "What is the difference between refurbished and new products?",
    answer:
      "Refurbished products have been repaired and tested to ensure functionality. They may show slight wear but are generally more affordable than new items. New products are unused and come in original packaging. When purchasing refurbished items, look for those certified by the manufacturer or a reputable third party to ensure quality and reliability.",
  },
  {
    question: "How can I find out about product recalls?",
    answer:
      "Check the product's official website, the manufacturer's website, or government websites for recalls. You can also sign up for email alerts from consumer protection organizations. Additionally, following the manufacturer and relevant product safety organizations on social media can provide timely updates on recalls and safety concerns.",
  },
  {
    question: "Can I cancel an order after it has been placed?",
    answer:
      "It depends on the retailer and the stage of processing. Quickly contact customer service to inquire about cancellation possibilities. Some retailers have a short window for order cancellations, especially if the order has already been processed or shipped. Being proactive in reaching out can increase the chances of a successful cancellation",
  },
  {
    question: "What should I do if a product arrives damaged?",
    answer:
      "Contact the retailer's customer service immediately. Most retailers have a process for handling damaged or defective items and may offer a replacement or refund. Take clear photos of the damage and provide detailed information to expedite the resolution process. Many retailers prioritize customer satisfaction and will work to resolve the issue promptly.",
  },
  {
    question: "How can I extend the lifespan of electronic devices?",
    answer:
      "Keep devices in a cool and dry place, install software updates regularly, use protective cases, and follow manufacturer recommendations for charging. Avoid exposing devices to extreme temperatures, and consider investing in surge protectors to safeguard against electrical issues.",
  },
  {
    question: "Are online reviews reliable for making purchasing decisions?",
    answer:
      "Online reviews can be helpful, but it's essential to consider the overall sentiment and read multiple reviews. Look for detailed reviews that discuss both positive and negative aspects of the product. Consider the credibility of the source, and be aware that some reviews may be influenced by factors like personal preferences or sponsored content.",
  },
  {
    question:
      "How do I find the best deals and discounts when shopping online?",
    answer:
      "Subscribe to newsletters, follow retailers on social media, and use price comparison tools. Many retailers also offer discounts for first-time shoppers or during seasonal sales. Additionally, consider browser extensions that automatically apply coupon codes at checkout, maximizing your savings.",
  },
  {
    question: "What is the return policy for most products?",
    answer:
      "Return policies vary by retailer. Typically, there is a specified window (e.g., 30 days) for returns. Check the retailer's website or contact customer service for specific details. Some retailers may offer free returns, while others may deduct return shipping costs from your refund. It's crucial to review the policy before making a purchase to ensure you're comfortable with the terms.",
  },

  {
    question: "How can I track my online order?",
    answer:
      "Most online retailers provide a tracking number in your order confirmation email. You can use this number on the carrier's website to track the status and location of your package. Additionally, some carriers offer detailed tracking information, including estimated delivery times and real-time updates on the package's journey.",
  },
];

export const qaData = [
  {
    question: "Does the dress offer any UV protection?",
    answer:
      "Yes, the dress offers UV protection. It blocks harmful UV rays, providing an additional layer of sun safety.",
  },
  {
    question:
      "Are there any pockets, and if so, how many and where are they located?",
    answer:
      "Yes, there are pockets. There are two pockets, one on each side of the garment.",
  },
  {
    question: "Is the fabric breathable and quick-drying?",
    answer:
      "Yes, the fabric is breathable, allowing for excellent airflow. Additionally, it is quick-drying, ensuring comfort during and after activities.",
  },
];

export const reviews = [
  {
    name: "John Due",
    date: "10 Aug 2024 11:05 AM",
    rating: 5,
    comment:
      "Wow! This fashion product exceeded all my expectations! From the moment I opened the package, I could tell it was something special. The quality of the materials is outstanding.",
  },
  {
    name: "Rhoda Mayer",
    date: "10 Aug 2024 11:05 AM",
    rating: 5,
    comment:
      "Nice the attention to detail in the craftsmanship is truly impressive. Not only does it look fabulous, but it feels incredibly comfortable too. I've received so many compliments whenever I wear it!",
  },
  {
    name: "Jack Deo",
    date: "10 Aug 2024 11:05 AM",
    rating: 5,
    comment:
      "The product boasts impressive craftsmanship, meticulous attention to detail, and",
  },
];

export const ratingCounts = {
  5: 9,
  4: 7,
  3: 5,
  2: 3,
  1: 1,
};

export const orders = [
  {
    id: 1020,
    date: "06 Jul 2024 03:51PM",
    amount: 61.73,
    status: "Pending",
    method: "COD",
  },
  {
    id: 1017,
    date: "06 Jul 2024 03:15PM",
    amount: 1.97,
    status: "Pending",
    method: "COD",
  },
  {
    id: 1016,
    date: "26 Jun 2024 10:23AM",
    amount: 46.14,
    status: "Pending",
    method: "COD",
  },
  {
    id: 1015,
    date: "25 Jun 2024 06:34PM",
    amount: 18.75,
    status: "Pending",
    method: "COD",
  },
  {
    id: 1013,
    date: "24 Jun 2024 02:29PM",
    amount: 1.72,
    status: "Pending",
    method: "COD",
  },
];

export const refunds = [
  {
    id: 1000,
    status: "Rejected",
    reason: "Item Was Damaged. Also, Fabric Was Not Good As Expected",
    date: "21 Jun 2024",
  },
];

export const wallet = [
  {
    date: "06 Jul 2024 03:15PM",
    amount: 39.4,
    remark: "Wallet Amount Successfully Debited For Order #1017",
    status: "Debit",
  },
  {
    date: "25 Jun 2024 06:34PM",
    amount: 375.0,
    remark: "Wallet Amount Successfully Debited For Order #1015",
    status: "Debit",
  },
  {
    date: "24 Jun 2024 02:29PM",
    amount: 34.44,
    remark: "Wallet Amount Successfully Debited For Order #1013",
    status: "Debit",
  },
  {
    date: "21 Jun 2024 04:29PM",
    amount: 75.21,
    remark: "Wallet Amount Successfully Debited For Order #1010",
    status: "Debit",
  },
];

export const notifications = [
  {
    message:
      "Your order has been successfully placed. Order ID: #1013. Thank you for choosing us.",
    time: "24 Jun 2024 02:29:PM",
  },
  {
    message: "Your Refund request status has been rejected",
    time: "21 Jun 2024 05:42:PM",
  },
  {
    message:
      "Your order has been successfully placed. Order ID: #1012. Thank you for choosing us.",
    time: "21 Jun 2024 05:18:PM",
  },
  {
    message:
      "Your order has been successfully placed. Order ID: #1011. Thank you for choosing us.",
    time: "21 Jun 2024 05:18:PM",
  },
  {
    message:
      "Your order has been successfully placed. Order ID: #1010. Thank you for choosing us.",
    time: "21 Jun 2024 04:29:PM",
  },
  {
    message:
      "Your order has been successfully placed, Order ID: #1009, Thank you for choosing us.",
    time: "21 Jun 2024 04:29:PM",
  },
];
