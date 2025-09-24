import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseConfig {
  // TODO: Substituir pelas credenciais reais do projeto Supabase
  static const String url = 'https://sxbslulfitfsijqrzljd.supabase.co';
  static const String anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4YnNsdWxmaXRmc2lqcXJ6bGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NDg4NDksImV4cCI6MjA3MzUyNDg0OX0.ivAdA58zHtj3XNrXKG9DKMX6jynhhv77nz39IvJZjPM';
  
  // Manter compatibilidade com nomes antigos
  static const String supabaseUrl = url;
  static const String supabaseAnonKey = anonKey;
  
  static Future<void> initialize() async {
    await Supabase.initialize(
      url: url,
      anonKey: anonKey,
    );
  }
  
  static SupabaseClient get client => Supabase.instance.client;
}