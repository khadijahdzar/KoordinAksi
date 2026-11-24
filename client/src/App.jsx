import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { Instagram, Linkedin, Mail, MapPin, Menu, Phone, X } from "lucide-react";
import api, { getErrorMessage } from "./api";
import { getDashboardPath, useAuth } from "@/AuthContext";
import GoogleAuthButton from "./components/GoogleAuthButton";
import SiteHeader from "./components/SiteHeader";
import HeroSection from "./components/HeroSection";
