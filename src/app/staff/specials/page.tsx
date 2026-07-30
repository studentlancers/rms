"use client";

import React, { useState, useMemo } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Search,
  Sparkles,
  Eye,
} from "lucide-react";

interface DailySpecialItem {
  id: string;
  name: string;
  category: string;
  regularPrice: string;
  todayPrice: string;
  discount: string;
  availableQty: string;
  chefRecommendation: "Must Try ⭐" | "Signature Dish" | "Seasonal Special";
  description: string;
}

const initialSpecials: DailySpecialItem[] = [
  {
    id: "SP-01",
    name: "Truffle Infused Lobster Ravioli",
    category: "Chef Special",
    regularPrice: "₹850.00",
    todayPrice: "₹690.00",
    discount: "18% OFF",
    availableQty: "8 portions left",
    chefRecommendation: "Must Try ⭐",
    description: "Handmade pasta stuffed with fresh lobster, finished with black truffle butter sauce.",
  },
  {
    id: "SP-02",
    name: "Slow-Cooked Dal Baluchi",
    category: "Main Course",
    regularPrice: "₹380.00",
    todayPrice: "₹310.00",
    discount: "18% OFF",
    availableQty: "24 portions",
    chefRecommendation: "Signature Dish",
    description: "Black lentils simmered overnight over slow charcoal embers with organic white butter.",
  },
  {
    id: "SP-03",
    name: "Charcoal Grilled Tandoori Lamb Chops",
    category: "Starters",
    regularPrice: "₹650.00",
    todayPrice: "₹540.00",
    discount: "16% OFF",
    availableQty: "5 portions left",
    chefRecommendation: "Must Try ⭐",
    description: "Tender lamb chops marinated in Kashmiri chili, hung curd, and roasted spices.",
  },
  {
    id: "SP-04",
    name: "Matcha & White Chocolate Mousse",
    category: "Dessert",
    regularPrice: "₹290.00",
    todayPrice: "₹240.00",
    discount: "17% OFF",
    availableQty: "15 portions",
    chefRecommendation: "Seasonal Special",
    description: "Japanese ceremonial Uji matcha mousse layered with Belgian white chocolate ganache.",
  },
];

export default function DailySpecialsPage() {
  const [specials] = useState<DailySpecialItem[]>(initialSpecials);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSpecial, setSelectedSpecial] = useState<DailySpecialItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const filteredSpecials = useMemo(() => {
    return specials.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [specials, searchQuery, selectedCategory]);

  const totalSpecials = specials.length;
  const signatureCount = specials.filter((s) => s.chefRecommendation === "Signature Dish" || s.chefRecommendation === "Must Try ⭐").length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="design-section-label mb-3">TODAY'S HIGHLIGHTS (VIEW ONLY)</div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900">
            Today's Specials
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse today's available special menu items and chef recommendations.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="TODAY'S SPECIAL DISHES"
          value={`${totalSpecials} Dishes`}
          subtext="featured by Executive Chef"
          trend={{ value: "↗ Chef's Selection", isPositive: true }}
        />
        <StatCard
          label="CHEF RECOMMENDATIONS"
          value={`${signatureCount} Must Try`}
          subtext="signature recommendations"
          trend={{ value: "⭐ Top Seller", isPositive: true }}
        />
        <StatCard
          label="SPECIAL OFFER SAVINGS"
          value="Up to 18% OFF"
          subtext="active shift discounts"
          trend={{ value: "↗ High Demand", isPositive: true }}
        />
      </div>

      {/* Data Table Surface */}
      <div className="design-surface p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
            <Input
              placeholder="Search special dish or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 h-9 bg-slate-50 border-slate-200/80 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-600/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none cursor-pointer h-9"
            >
              <option value="all">All Categories</option>
              <option value="Chef Special">Chef Special</option>
              <option value="Main Course">Main Course</option>
              <option value="Starters">Starters</option>
              <option value="Dessert">Dessert</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase hover:bg-transparent">
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">DISH ITEM</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">CATEGORY</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">REGULAR</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">TODAY'S PRICE</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold hidden md:table-cell">DISCOUNT</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold">AVAILABLE QTY</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold hidden lg:table-cell">RECOMMENDATION</TableHead>
              <TableHead className="py-3 px-4 h-auto text-slate-400 font-mono font-semibold text-right">ACTION</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 text-xs">
            {filteredSpecials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-400 text-xs">
                  No daily specials available.
                </TableCell>
              </TableRow>
            ) : (
              filteredSpecials.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors border-slate-100">
                  <TableCell className="py-4 px-4">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{item.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-4 text-slate-600">
                    {item.category}
                  </TableCell>
                  <TableCell className="py-4 px-4 font-mono text-slate-400 line-through">
                    {item.regularPrice}
                  </TableCell>
                  <TableCell className="py-4 px-4 font-mono font-bold text-emerald-600">
                    {item.todayPrice}
                  </TableCell>
                  <TableCell className="py-4 px-4 font-mono font-semibold text-blue-600 hidden md:table-cell">
                    {item.discount}
                  </TableCell>
                  <TableCell className="py-4 px-4 font-medium text-slate-700">
                    {item.availableQty}
                  </TableCell>
                  <TableCell className="py-4 px-4 font-semibold text-amber-600 hidden lg:table-cell">
                    {item.chefRecommendation}
                  </TableCell>
                  <TableCell className="py-4 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedSpecial(item);
                        setIsDetailOpen(true);
                      }}
                      className="h-8 px-2.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Details Modal */}
      {selectedSpecial && isDetailOpen && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Today's Special — ${selectedSpecial.name}`}
        >
          <div className="space-y-4 py-2 text-xs">
            <div className="flex justify-between items-center p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div>
                <span className="text-amber-800 font-bold text-sm">{selectedSpecial.chefRecommendation}</span>
                <span className="text-amber-600 block">{selectedSpecial.category}</span>
              </div>
              <span className="font-mono font-bold text-emerald-600 text-sm">{selectedSpecial.todayPrice}</span>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-700 uppercase block">Description & Preparation</span>
              <div className="p-3 border border-slate-200 rounded-lg bg-white text-slate-800 leading-relaxed">
                {selectedSpecial.description}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Discount Rate</span>
                <span className="text-sm font-bold text-blue-600">{selectedSpecial.discount} (Reg. {selectedSpecial.regularPrice})</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Portions Available</span>
                <span className="text-sm font-bold text-slate-800">{selectedSpecial.availableQty}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
