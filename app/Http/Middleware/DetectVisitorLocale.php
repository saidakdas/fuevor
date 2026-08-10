<?php

namespace App\Http\Middleware;

use App\Services\CountryLocaleResolver;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class DetectVisitorLocale
{
    public function __construct(private readonly CountryLocaleResolver $resolver) {}

    public function handle(Request $request, Closure $next): Response
    {
        App::setLocale($this->resolver->resolve($request));

        return $next($request);
    }
}
